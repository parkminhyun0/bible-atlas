import bpy
import math
import os
import sys
from mathutils import Vector


def arg(name, default=None):
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if name in args and args.index(name) + 1 < len(args):
        return args[args.index(name) + 1]
    return default


OUTPUT = os.path.abspath(arg('--output', 'visitor-realistic.glb'))
LOD = arg('--lod', 'high')
HIGH = LOD == 'high'
SEG = 24 if HIGH else 14
RINGS = 16 if HIGH else 8
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
WEAVE = os.path.join(ROOT, 'assets', 'herod-temple', 'character', 'visitor-cloak-weave-v1.png')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)


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
        tex.interpolation = 'Linear'
        mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


SKIN = material('skin_warm_olive', (0.43, 0.23, 0.14), 0.82)
SKIN_LIGHT = material('skin_highlight', (0.58, 0.34, 0.22), 0.84)
TUNIC = material('linen_cream', (0.70, 0.62, 0.47), 0.96)
CLOAK = material('woven_taupe_cloak', (0.55, 0.48, 0.38), 0.98, WEAVE)
SCARF = material('linen_headscarf', (0.62, 0.55, 0.45), 0.96)
HAIR = material('dark_hair', (0.045, 0.028, 0.022), 0.98)
LEATHER = material('brown_leather', (0.16, 0.075, 0.038), 0.88)
EYE = material('dark_eye', (0.018, 0.012, 0.009), 0.7)


def finish(obj, mat, name, parent=None, bevel=0.0):
    obj.name = name
    obj.data.materials.append(mat)
    if hasattr(obj.data, 'polygons'):
        for poly in obj.data.polygons:
            poly.use_smooth = True
    if bevel:
        mod = obj.modifiers.new('soft_edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 2 if HIGH else 1
    if parent:
        world = obj.matrix_world.copy()
        obj.parent = parent
        obj.matrix_world = world
    return obj


def sphere(name, loc, scale, mat, parent=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=SEG, ring_count=RINGS, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, name, parent)


def cylinder(name, loc, radius, depth, mat, parent=None, vertices=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices or SEG, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, name, parent, 0.012 if HIGH else 0.006)


def cone(name, loc, r1, r2, depth, mat, parent=None):
    bpy.ops.mesh.primitive_cone_add(vertices=SEG, radius1=r1, radius2=r2, depth=depth, location=loc)
    return finish(bpy.context.object, mat, name, parent, 0.012 if HIGH else 0.006)


def cube(name, loc, scale, mat, parent=None, rotation=(0, 0, 0), bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, mat, name, parent, bevel)


def empty(name, loc, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    if parent:
        obj.parent = parent
    return obj


root = empty('visitorAvatar', (0, 0, 0))
torso = cone('torso_tunic', (0, 0, 1.13), 0.31, 0.24, 0.92, TUNIC, root)
skirt = cone('linen_skirt', (0, 0, 0.60), 0.39, 0.30, 0.72, TUNIC, root)
cylinder('leather_belt', (0, 0, 0.98), 0.315, 0.09, LEATHER, root)

# Cloak: rounded shoulder mantle, broad back drape, and two open front panels.
sphere('cloak_shoulders', (0, -0.015, 1.37), (0.47, 0.30, 0.22), CLOAK, root)
cube('cloak_back', (0, -0.205, 0.88), (0.44, 0.055, 0.59), CLOAK, root, bevel=0.06)
for side in (-1, 1):
    cube(f'cloak_front_{side:+d}', (side * 0.235, 0.245, 0.90), (0.18, 0.045, 0.53), CLOAK, root,
         rotation=(0, side * 0.08, side * 0.035), bevel=0.045)

# Cross-body strap and pouch from the reference.
strap = cube('cross_body_strap', (-0.06, 0.30, 1.22), (0.025, 0.025, 0.48), LEATHER, root,
             rotation=(0, 0, -0.48), bevel=0.01)
cube('leather_pouch', (0.35, 0.26, 0.88), (0.16, 0.075, 0.17), LEATHER, root, bevel=0.035)

# Head and face.
sphere('head', (0, 0.01, 1.72), (0.185, 0.17, 0.22), SKIN_LIGHT, root)
sphere('left_ear', (-0.19, 0.01, 1.72), (0.035, 0.025, 0.06), SKIN, root)
sphere('right_ear', (0.19, 0.01, 1.72), (0.035, 0.025, 0.06), SKIN, root)
sphere('nose', (0, 0.178, 1.71), (0.04, 0.065, 0.075), SKIN_LIGHT, root)
for side in (-1, 1):
    sphere(f'eye_{side:+d}', (side * 0.063, 0.168, 1.77), (0.022, 0.015, 0.014), EYE, root)
    cube(f'brow_{side:+d}', (side * 0.062, 0.178, 1.807), (0.055, 0.009, 0.012), HAIR, root,
         rotation=(0, 0, -side * 0.08), bevel=0.008)

# Long dark hair and full beard.
sphere('hair_cap', (0, -0.015, 1.82), (0.205, 0.18, 0.18), HAIR, root)
for side in (-1, 1):
    sphere(f'long_hair_{side:+d}', (side * 0.16, -0.065, 1.55), (0.105, 0.10, 0.34), HAIR, root)
sphere('back_hair', (0, -0.15, 1.57), (0.17, 0.085, 0.34), HAIR, root)
cone('full_beard', (0, 0.13, 1.51), 0.16, 0.10, 0.37, HAIR, root)
sphere('moustache', (0, 0.183, 1.655), (0.105, 0.025, 0.035), HAIR, root)

# Wrapped linen head covering and rear tails.
sphere('headscarf_cap', (0, -0.005, 1.855), (0.218, 0.19, 0.12), SCARF, root)
cylinder('headscarf_band', (0, 0, 1.825), 0.213, 0.065, SCARF, root)
cube('headscarf_tail_long', (0.06, -0.205, 1.57), (0.07, 0.018, 0.25), SCARF, root,
     rotation=(0, 0, -0.18), bevel=0.02)
cube('headscarf_tail_short', (-0.065, -0.21, 1.65), (0.055, 0.017, 0.17), SCARF, root,
     rotation=(0, 0, 0.16), bevel=0.02)

# Limb pivots are named for runtime walking/running animation.
for side, label in ((-1, 'Left'), (1, 'Right')):
    arm = empty(f'arm{label}', (side * 0.34, 0, 1.38), root)
    cylinder(f'upper_sleeve_{label}', (side * 0.34, 0, 1.19), 0.105, 0.40, TUNIC, arm)
    cylinder(f'forearm_{label}', (side * 0.34, 0.015, 0.87), 0.068, 0.32, SKIN, arm)
    sphere(f'hand_{label}', (side * 0.34, 0.025, 0.68), (0.078, 0.06, 0.10), SKIN_LIGHT, arm)

    leg = empty(f'leg{label}', (side * 0.135, 0, 0.70), root)
    cylinder(f'lower_leg_{label}', (side * 0.135, 0, 0.36), 0.082, 0.58, SKIN, leg)
    foot = cube(f'sandal_{label}', (side * 0.135, 0.075, 0.075), (0.105, 0.19, 0.055), LEATHER, leg, bevel=0.025)
    cube(f'sandal_strap_{label}', (side * 0.135, 0.115, 0.13), (0.11, 0.035, 0.025), LEATHER, leg,
         rotation=(0, 0, side * 0.25), bevel=0.01)

# Keep runtime pivots and the full character root in the exported scene.
bpy.context.view_layer.objects.active = torso
for obj in bpy.context.scene.objects:
    obj.select_set(True)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
)
print(f'visitor avatar exported: {OUTPUT} ({LOD})')
