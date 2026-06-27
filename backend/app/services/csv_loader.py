import os
import csv
import logging
from typing import List, Dict, Any

logger = logging.getLogger("uvicorn.error")

class CSVLoaderService:
    """
    Service responsible for loading and cleaning raw trade knowledge CSV entries.
    """
    @staticmethod
    def load_and_clean(filepath: str) -> List[Dict[str, Any]]:
        """
        Reads trade knowledge CSV and normalizes the text records.
        """
        if not os.path.exists(filepath):
            logger.error(f"Trade knowledge CSV not found at: {filepath}")
            return []
            
        cleaned_records = []
        required_cols = ["Term", "Definition", "Created By", "Used By", "Purpose", "Common Problems"]
        
        try:
            with open(filepath, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                
                # Check headers
                headers = reader.fieldnames if reader.fieldnames else []
                # Strip spaces from headers
                headers = [h.strip() for h in headers]
                
                for line_num, row in enumerate(reader, start=2):
                    # Strip whitespace from keys and values
                    cleaned_row = {k.strip(): v.strip() for k, v in row.items() if k is not None and v is not None}
                    
                    term = cleaned_row.get("Term") or cleaned_row.get("Terminology / Document")
                    definition = cleaned_row.get("Definition") or cleaned_row.get("Defination")
                    created_by = cleaned_row.get("Created By") or cleaned_row.get("Who creates / sends it \n(If any)") or cleaned_row.get("Who creates / sends it (If any)")
                    used_by = cleaned_row.get("Used By") or cleaned_row.get("Who recevies  it\n (If Any)") or cleaned_row.get("Who recevies it (If Any)")
                    purpose = cleaned_row.get("Purpose")
                    common_problems = cleaned_row.get("Common Problems") or cleaned_row.get("If not available, whats the issue?")
                    
                    # Skip empty rows
                    if not term or not definition:
                        logger.debug(f"Row {line_num} skipped due to missing Term or Definition.")
                        continue
                        
                    cleaned_records.append({
                        "Term": term,
                        "Definition": definition,
                        "Created By": created_by if created_by else "Not Specified",
                        "Used By": used_by if used_by else "Not Specified",
                        "Purpose": purpose if purpose else "Not Specified",
                        "Common Problems": common_problems if common_problems else "Not Specified"
                    })
                    
            logger.info(f"Loaded and cleaned {len(cleaned_records)} trade terms from {filepath}")
            return cleaned_records
            
        except Exception as e:
            logger.error(f"Error parsing trade knowledge CSV: {str(e)}")
            raise e
