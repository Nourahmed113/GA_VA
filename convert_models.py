
import torch
from pathlib import Path
import os
import shutil

def convert_models_to_cpu():
    # Base directory for models
    models_dir = Path("models").resolve()
    print(f"Scanning models in: {models_dir}")
    
    if not models_dir.exists():
        print(f"Error: {models_dir} does not exist!")
        return
        
    # Iterate over all dialect folders
    dialects = [d for d in models_dir.iterdir() if d.is_dir()]
    
    for dialect_dir in dialects:
        dialect_name = dialect_dir.name
        print(f"\n--- Processing dialect: {dialect_name} ---")
        
        # Files to convert (check for both checkpoint and s3gen/ve)
        files_to_check = [
            "t3_mtl23ls_v2.pt", 
            "s3gen.pt", 
            "ve.pt", 
            "conds.pt"
        ]
        
        for filename in files_to_check:
            file_path = dialect_dir / filename
            if not file_path.exists():
                continue
                
            print(f"Checking {filename}...")
            
            try:
                # Load with map_location='cpu' to force CPU mapping
                # validation: check if it loads without error on CPU-only machine
                # if it contains CUDA tensors, it usually fails unless map_location is set
                
                # We want to re-save it GUARANTEED to be cpu mapped
                data = torch.load(file_path, map_location='cpu', weights_only=False)
                
                # Check if it was already CPU (heuristic)
                # But to be safe, we just SAVE it again. 
                # Why? Because 'torch.load' maps it to memory, but saving it might preserve original device 
                # if we don't ensure tensors are cpu.
                # Actually, map_location='cpu' maps loaded tensors to CPU. Saving them saves as CPU.
                
                # Create backup
                backup_path = file_path.with_suffix('.pt.bak')
                if not backup_path.exists():
                    shutil.copy(file_path, backup_path)
                    print(f"  Backup created: {backup_path.name}")
                
                # Save back
                torch.save(data, file_path)
                print(f"  ✅ Converted & Saved: {filename}")
                
            except Exception as e:
                print(f"  ❌ Error converting {filename}: {e}")

if __name__ == "__main__":
    convert_models_to_cpu()
