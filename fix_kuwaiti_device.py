"""
Fix Kuwaiti model .pt files to be device-agnostic
Removes CUDA device dependencies by re-saving with map_location
"""
import torch
from pathlib import Path

model_dir = Path("/Users/nourahmed/Desktop/GenArabia/ChatterBox REACT/models/kuwaiti")

print("=" * 60)
print("Converting Kuwaiti Model Files to Device-Agnostic Format")
print("=" * 60)

# Files that need conversion
pt_files = [
    "ve.pt",
    "conds.pt",
    "s3gen.pt",
    "t3_mtl23ls_v2.pt"
]

for filename in pt_files:
    file_path = model_dir / filename
    
    if not file_path.exists():
        print(f"\n⚠️  {filename}: NOT FOUND")
        continue
    
    print(f"\n🔄 Processing {filename}...")
    
    try:
        # Load with CPU mapping to avoid CUDA errors
        data = torch.load(file_path, map_location='cpu', weights_only=False)
        
        # Save back to same file
        torch.save(data, file_path)
        
        print(f"✅ {filename}: Successfully converted to device-agnostic format")
        
    except Exception as e:
        print(f"❌ {filename}: Error - {str(e)}")

print("\n" + "=" * 60)
print("✨ Conversion complete!")
print("=" * 60)
