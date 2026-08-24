#!/usr/bin/env python3
"""
BibleAtlas · Herod Temple Master Floor Plan v0.1 -> Blender reference curves

Run inside Blender:
  blender --python tools/herod-temple/import-master-floor-plan-blender.py
or open the Scripting workspace and Run Script.

The script does NOT georeference Blender to WGS84. It creates the dimension-locked
H0 architectural frame at true metre scale. Cesium world placement remains the
responsibility of world_alignment.json / GLB modelMatrix.
"""
import json
from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = ROOT / "data/herod-temple/spec/master_floor_plan_v0_1.json"
COLLECTION = "REF_MASTER_FLOOR_PLAN_V0_1"

with PLAN_PATH.open("r", encoding="utf-8") as f:
    plan = json.load(f)

if abs(plan["units"]["cubit_live_m"] - 0.525) > 1e-9:
    raise RuntimeError("Approved cubit changed; refusing to import.")

scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'METERS'
scene.unit_settings.scale_length = 1.0

old = bpy.data.collections.get(COLLECTION)
if old:
    for obj in list(old.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(old)

col = bpy.data.collections.new(COLLECTION)
scene.collection.children.link(col)

def curve_obj(name, pts, z=0.0, cyclic=True, props=None):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.resolution_u = 1
    spl = cu.splines.new('POLY')
    spl.points.add(len(pts)-1)
    for p, (x, y) in zip(spl.points, pts):
        p.co = (float(x), float(y), float(z), 1.0)
    spl.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, cu)
    col.objects.link(obj)
    if props:
        for k,v in props.items():
            if isinstance(v, (str,int,float,bool)):
                obj[k] = v
    return obj

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0,0,0))
h0 = bpy.context.object
h0.name = "H0_HOLY_OF_HOLIES_CENTER"
for c in list(h0.users_collection):
    c.objects.unlink(h0)
col.objects.link(h0)
h0["frame"] = "+X east / +Y north / +Z up"
h0["site_model_x_m"] = plan["frames"]["architectural_H0"]["site_model_xz_m"][0]
h0["site_model_z_m"] = plan["frames"]["architectural_H0"]["site_model_xz_m"][1]
h0["derived_world_lat"] = plan["world_placement"]["derived_H0_wgs84"]["lat"]
h0["derived_world_lng"] = plan["world_placement"]["derived_H0_wgs84"]["lng"]
h0["world_alignment_status"] = plan["world_placement"]["alignment_status"]

curve_obj("REF_OUTER_PLATFORM", plan["outer_platform"]["polygon_H0_m"], 0.0, True,
          {"confidence": plan["outer_platform"]["confidence"]})
curve_obj("REF_500_CUBIT_SQUARE", plan["pre_herodian_500_cubit_square"]["polygon_H0_m"], 0.01, True,
          {"source": plan["pre_herodian_500_cubit_square"]["source"],
           "status": plan["pre_herodian_500_cubit_square"]["margin_status"]})

def rect_pts(r):
    return [(r["xmin"],r["ymin"]),(r["xmax"],r["ymin"]),
            (r["xmax"],r["ymax"]),(r["xmin"],r["ymax"])]

level_map = {
    "COURT_OF_WOMEN": plan["levels"]["court_of_women_m"],
    "COURT_OF_ISRAEL": plan["levels"]["court_of_israel_m"],
    "COURT_OF_PRIESTS": plan["levels"]["court_of_priests_m"],
}
for f in plan["features"]:
    if f.get("geometry") != "rect":
        continue
    z = level_map.get(f["id"], 0.02)
    if f["id"].startswith("WOMEN_CHAMBER"):
        z = plan["levels"]["court_of_women_m"]
    if f["id"].startswith("ALTAR") or f["id"] == "ALTAR_TO_PORCH_CLEAR_ZONE":
        z = plan["levels"]["court_of_priests_m"]
    if f["id"].startswith("SANCTUARY") or f["id"].startswith("ULAM") or f["id"] == "HOLY_OF_HOLIES_INTERIOR":
        z = plan["levels"]["sanctuary_floor_m"]
    curve_obj("REF_" + f["id"], rect_pts(f["rect_m"]), z, True,
              {"source":f.get("source",""),"confidence":f.get("confidence",""),
               "status":f.get("status",""),"notes":f.get("notes","")})

curve_obj("REF_AXIS_EAST_WEST", [(-30,0),(165,0)], plan["levels"]["sanctuary_floor_m"]+0.03, False)
curve_obj("REF_AXIS_NORTH_SOUTH", [(0,-45),(0,45)], plan["levels"]["sanctuary_floor_m"]+0.03, False)

col["bibleatlas_schema"] = plan["schema"]
col["version"] = plan["version"]
col["cubit_m"] = plan["units"]["cubit_live_m"]
col["world_alignment_ssot"] = plan["world_placement"]["alignment_ssot"]
col["world_alignment_rms_m"] = plan["world_placement"]["current_horizontal_rms_m"]
col["warning"] = "Do not visually nudge/scale/rotate. Improve world_alignment.json instead."

print(f"[BibleAtlas] Imported {len(col.objects)} STEP02 reference objects at 1 BU = 1 m")
print("[BibleAtlas] H0 = Holy of Holies center; +X east, +Y north, +Z up")
print(f"[BibleAtlas] World alignment remains {plan['world_placement']['alignment_status']} "
      f"(RMS {plan['world_placement']['current_horizontal_rms_m']} m)")
