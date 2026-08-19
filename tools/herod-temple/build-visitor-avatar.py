"""Build the BibleAtlas visitor from Blender's CC0 Human Base Meshes v1.4.1.

Source: https://www.blender.org/download/demo-files/ (Human Base Meshes, CC0)
The source bundle is intentionally not committed. Pass --base-blend to its .blend file.
"""
import bpy
import math
import os
import sys


def arg(name, default=None):
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    return args[args.index(name) + 1] if name in args and args.index(name) + 1 < len(args) else default


OUTPUT = os.path.abspath(arg('--output', 'visitor-realistic.glb'))
BASE_BLEND = os.path.abspath(arg('--base-blend', 'human_base_meshes_bundle.blend'))
LOD = arg('--lod', 'high')
HIGH = LOD == 'high'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WEAVE = os.path.join(ROOT, 'assets', 'herod-temple', 'character', 'visitor-cloak-weave-v1.png')

if not os.path.exists(BASE_BLEND):
    raise FileNotFoundError('Pass --base-blend from Blender Human Base Meshes v1.4.1 (CC0).')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

with bpy.data.libraries.load(BASE_BLEND, link=False) as (source, target):
    wanted = {'GEO-body_male_realistic', 'GEO-body_male_realistic.eye.L', 'GEO-body_male_realistic.eye.R'}
    target.objects = [name for name in source.objects if name in wanted]

body_parts = []
for obj in target.objects:
    if obj:
        bpy.context.collection.objects.link(obj)
        obj.location.x += 2.2643022537
        obj.scale *= 1.10
        body_parts.append(obj)


def material(name, color, roughness=0.9, texture=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    if texture and os.path.exists(texture):
        image = bpy.data.images.load(texture, check_existing=True)
        tex = mat.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = image
        mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


SKIN = material('skin_warm_olive', (0.38, 0.20, 0.12), 0.78)
EYE = material('eyes_dark_brown', (0.025, 0.018, 0.014), 0.55)
LINEN = material('linen_cream', (0.68, 0.59, 0.43), 0.94)
CLOAK = material('woven_taupe_cloak', (0.47, 0.40, 0.31), 0.98, WEAVE)
SCARF = material('headscarf_linen', (0.63, 0.56, 0.45), 0.96)
HAIR = material('hair_dark_brown', (0.055, 0.032, 0.022), 0.97)
LEATHER = material('aged_leather', (0.20, 0.105, 0.055), 0.91)

for obj in body_parts:
    obj.data.materials.clear()
    obj.data.materials.append(EYE if '.eye.' in obj.name else SKIN)
    if '.eye.' not in obj.name:
        obj.data.materials.append(LINEN)
        obj.data.materials.append(HAIR)
        # Use the anatomically correct body surface as a fitted under-tunic/trousers.
        # Head, forearms/hands, and feet remain skin; the covered torso/legs become linen.
        for poly in obj.data.polygons:
            center = poly.center
            exposed_head = center.z > 1.39
            exposed_hands = abs(center.x) > 0.27 and center.z < 1.10
            exposed_feet = center.z < 0.16
            facial_hair = 1.43 < center.z < 1.64 and center.y < -0.075 and abs(center.x) < 0.15
            if facial_hair:
                poly.material_index = 2
            else:
                poly.material_index = 0 if exposed_head or exposed_hands or exposed_feet else 1
    if obj.type == 'MESH':
        for poly in obj.data.polygons:
            poly.use_smooth = True
        multires = next((m for m in obj.modifiers if m.type == 'MULTIRES'), None)
        if multires:
            multires.levels = 0 if not HIGH else min(1, multires.total_levels)
            multires.render_levels = multires.levels


def smooth(obj, bevel=0.0):
    if obj.type == 'MESH':
        for poly in obj.data.polygons:
            poly.use_smooth = True
    if bevel:
        mod = obj.modifiers.new('soft garment edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3 if HIGH else 2
    return obj


def cone(name, loc, r1, r2, depth, mat):
    bpy.ops.mesh.primitive_cone_add(vertices=32 if HIGH else 20, radius1=r1, radius2=r2, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return smooth(obj, 0.018)


def sphere(name, loc, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32 if HIGH else 20, ring_count=20 if HIGH else 12, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return smooth(obj)


def rounded_box(name, loc, scale, mat, rotation=(0, 0, 0), bevel=0.035):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return smooth(obj, bevel)


def cape_mesh():
    # A single rounded cloak silhouette avoids the rigid front/back box panels.
    verts = [(-0.34, 0.12, 1.43), (0.34, 0.12, 1.43), (0.39, 0.14, 1.18),
             (0.36, 0.16, 0.82), (0.25, 0.17, 0.45), (0, 0.18, 0.38),
             (-0.25, 0.17, 0.45), (-0.36, 0.16, 0.82), (-0.39, 0.14, 1.18)]
    mesh = bpy.data.meshes.new('woven_cape_mesh')
    mesh.from_pydata(verts, [], [tuple(range(len(verts)))])
    mesh.materials.append(CLOAK)
    obj = bpy.data.objects.new('woven_cape', mesh)
    bpy.context.collection.objects.link(obj)
    solid = obj.modifiers.new('cloth thickness', 'SOLIDIFY')
    solid.thickness = 0.018
    return smooth(obj, 0.045)


garments = []
garments += [
    cape_mesh(),
]

# Head covering, layered hair, and beard follow the supplied four-view reference.
garments += [
    sphere('long_hair_back', (0, 0.09, 1.54), (0.16, 0.085, 0.23), HAIR),
    sphere('long_hair_left', (-0.145, 0.02, 1.54), (0.070, 0.065, 0.23), HAIR),
    sphere('long_hair_right', (0.145, 0.02, 1.54), (0.070, 0.065, 0.23), HAIR),
    sphere('wrapped_headscarf', (0, 0, 1.79), (0.17, 0.14, 0.09), SCARF),
    rounded_box('headscarf_tail', (0.07, 0.16, 1.56), (0.065, 0.018, 0.23), SCARF,
                rotation=(0, 0, -0.13), bevel=0.025),
]
bpy.ops.mesh.primitive_torus_add(major_radius=0.16, minor_radius=0.018, major_segments=32, minor_segments=8,
                                 location=(0, 0, 1.76))
headband = bpy.context.object
headband.name = 'headscarf_band'
headband.data.materials.append(SCARF)
garments.append(headband)

# The lower robe follows the character root as one cloth volume. Giving a skirt
# automatic leg weights split it apart in motion, so it intentionally stays rigid.
static_garments = [cone('knee_length_linen_robe', (0, 0, 0.68), 0.32, 0.215, 0.72, LINEN)]
bpy.ops.mesh.primitive_torus_add(major_radius=0.215, minor_radius=0.012, major_segments=32, minor_segments=8,
                                 location=(0, 0, 1.01))
robe_belt = bpy.context.object
robe_belt.name = 'narrow_leather_belt'
robe_belt.data.materials.append(LEATHER)
static_garments.append(robe_belt)
# Lightweight deforming skeleton. Named bones are the browser runtime contract.
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
rig = bpy.context.object
rig.name = 'visitorRig'
armature = rig.data
armature.name = 'visitorRig'
armature.edit_bones.remove(armature.edit_bones[0])


def bone(name, head, tail, parent=None):
    item = armature.edit_bones.new(name)
    item.head, item.tail = head, tail
    item.parent = parent
    return item


root_bone = bone('root', (0, 0, 0.08), (0, 0, 0.94))
spine = bone('spine', (0, 0, 0.94), (0, 0, 1.54), root_bone)
bone('head', (0, 0, 1.54), (0, 0, 1.86), spine)
for side, label in ((-1, 'Left'), (1, 'Right')):
    arm = bone(f'arm{label}', (side * 0.25, 0, 1.43), (side * 0.39, 0, 1.10), spine)
    bone(f'forearm{label}', (side * 0.39, 0, 1.10), (side * 0.42, 0, 0.77), arm)
    leg = bone(f'leg{label}', (side * 0.14, 0, 0.93), (side * 0.14, 0, 0.50), root_bone)
    bone(f'shin{label}', (side * 0.14, 0, 0.50), (side * 0.12, 0, 0.09), leg)
bpy.ops.object.mode_set(mode='OBJECT')

# Body and garments receive automatic weights so walking bends the silhouette instead of swinging blocks.
deform_objects = body_parts + garments
bpy.ops.object.select_all(action='DESELECT')
for obj in deform_objects:
    obj.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format='GLB',
    export_apply=False,
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
)
print(f'visitor avatar exported: {OUTPUT} ({LOD})')
