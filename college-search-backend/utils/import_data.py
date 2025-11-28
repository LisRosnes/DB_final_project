"""
Sample data import script for College Scorecard data
This is a template - adjust based on your actual data files
"""
import pandas as pd
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'college_scorecard')

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]


def create_indexes():
    """Create all necessary indexes for optimal query performance"""
    print("Creating indexes...")
    
    # Schools collection indexes
    print("- Creating schools indexes...")
    db.schools.create_index([('school_id', 1)], unique=True)
    db.schools.create_index([('school.name', 'text'), ('school.alias', 'text')])
    db.schools.create_index([('school.state', 1)])
    # Index by state and cost (tuition or avg_net_price if available) for faster filtering
    db.schools.create_index([('school.state', 1), ('latest.cost.tuition.in_state', 1)])
    db.schools.create_index([('school.ownership', 1)])
    db.schools.create_index([('school.degrees_awarded.predominant', 1)])
    db.schools.create_index([('latest.admissions.admission_rate.overall', 1)])
    db.schools.create_index([('latest.cost.avg_net_price.overall', 1)])
    # Note: earnings typically live in `costs_aid_completion` collection; this index is optional
    db.schools.create_index([('latest.earnings.10_yrs_after_entry.median', -1)])
    db.schools.create_index([('latest.completion.completion_rate_4yr_150nt', -1)])
    db.schools.create_index([('latest.student.size', 1)])
    db.schools.create_index([('location.lat', 1), ('location.lon', 1)])
    
    # Admissions_student collection indexes
    print("- Creating admissions_student indexes...")
    db.admissions_student.create_index([('school_id', 1), ('year', -1)])
    db.admissions_student.create_index([('year', -1)])
    db.admissions_student.create_index([('admissions.admission_rate.overall', 1)])
    db.admissions_student.create_index([('student.size', 1)])
    
    # Academics_programs collection indexes
    print("- Creating academics_programs indexes...")
    db.academics_programs.create_index([('school_id', 1), ('year', -1)])
    db.academics_programs.create_index([('year', -1)])
    db.academics_programs.create_index([('program_percentage.computer', 1)])
    db.academics_programs.create_index([('program_percentage.engineering', 1)])
    db.academics_programs.create_index([('program_percentage.business_marketing', 1)])
    db.academics_programs.create_index([('program.bachelors.computer', 1)])
    
    # Costs_aid_completion collection indexes
    print("- Creating costs_aid_completion indexes...")
    db.costs_aid_completion.create_index([('school_id', 1), ('year', -1)])
    db.costs_aid_completion.create_index([('year', -1)])
    db.costs_aid_completion.create_index([('cost.avg_net_price.overall', 1)])
    db.costs_aid_completion.create_index([('earnings.10_yrs_after_entry.median', -1)])
    db.costs_aid_completion.create_index([('completion.completion_rate_4yr_150nt', -1)])
    db.costs_aid_completion.create_index([('repayment.3_yr_default_rate', 1)])
    
    # Programs_field_of_study collection indexes
    print("- Creating programs_field_of_study indexes...")
    db.programs_field_of_study.create_index([('school_id', 1), ('year', -1)])
    db.programs_field_of_study.create_index([('programs.cip_code', 1)])
    db.programs_field_of_study.create_index([('programs.cip_code', 1), ('year', -1)])
    db.programs_field_of_study.create_index([('programs.credential_level', 1)])
    db.programs_field_of_study.create_index([('programs.earnings.1_yr_after.median', -1)])
    
    print("✓ All indexes created successfully!")


def import_schools_data(csv_file):
    """
    Import schools data from CSV
    
    Example CSV structure should have columns like:
    - UNITID (school_id)
    - INSTNM (school name)
    - CITY, STABBR, ZIP
    - LATITUDE, LONGITUDE
    - etc.
    """
    print(f"\nImporting schools data from {csv_file}...")
    
    # Read CSV
    df = pd.read_csv(csv_file)
    
    schools = []
    for _, row in df.iterrows():
        # Build school document according to schema
        school_doc = {
            'school_id': int(row['UNITID']),
            'ope8_id': row.get('OPEID8'),
            'ope6_id': row.get('OPEID6'),
            
            'school': {
                'name': row.get('INSTNM'),
                'city': row.get('CITY'),
                'state': row.get('STABBR'),
                'zip': row.get('ZIP'),
                'school_url': row.get('INSTURL'),
                'ownership': int(row.get('CONTROL', 0)),
                # Add more fields as per your CSV structure
            },
            
            'location': {
                'lat': float(row['LATITUDE']) if pd.notna(row.get('LATITUDE')) else None,
                'lon': float(row['LONGITUDE']) if pd.notna(row.get('LONGITUDE')) else None
            },
            
            'latest': {
                'year': 2024,  # Update based on data
                'admission_rate': float(row['ADM_RATE']) if pd.notna(row.get('ADM_RATE')) else None,
                # Add more latest fields
            },
            
            'last_updated': datetime.now()
        }
        
        schools.append(school_doc)
    
    # Bulk insert
    if schools:
        result = db.schools.insert_many(schools, ordered=False)
        print(f"✓ Imported {len(result.inserted_ids)} schools")
    
    return len(schools)


def import_costs_outcomes_data(csv_file, year):
    """
    Import costs, aid, completion, and earnings data
    """
    print(f"\nImporting costs/outcomes data for year {year} from {csv_file}...")
    
    df = pd.read_csv(csv_file)
    
    documents = []
    for _, row in df.iterrows():
        doc = {
            'school_id': int(row['UNITID']),
            'year': year,
            
            'cost': {
                'tuition': {
                    'in_state': float(row['TUITIONFEE_IN']) if pd.notna(row.get('TUITIONFEE_IN')) else None,
                    'out_of_state': float(row['TUITIONFEE_OUT']) if pd.notna(row.get('TUITIONFEE_OUT')) else None,
                },
                'avg_net_price': {
                    'overall': float(row['NPT4_PUB']) if pd.notna(row.get('NPT4_PUB')) else float(row.get('NPT4_PRIV')) if pd.notna(row.get('NPT4_PRIV')) else None
                }
            },
            
            'earnings': {
                '10_yrs_after_entry': {
                    'median': float(row['MD_EARN_WNE_P10']) if pd.notna(row.get('MD_EARN_WNE_P10')) else None
                }
            },
            
            'completion': {
                'completion_rate_4yr_150nt': float(row['C150_4']) if pd.notna(row.get('C150_4')) else None,
                'completion_rate_overall': float(row['C150_L4']) if pd.notna(row.get('C150_L4')) else None
            },
            
            # Add more fields based on your CSV structure
        }
        
        documents.append(doc)
    
    if documents:
        result = db.costs_aid_completion.insert_many(documents, ordered=False)
        print(f"✓ Imported {len(result.inserted_ids)} cost/outcome records")
    
    return len(documents)


def verify_data():
    """Verify imported data"""
    print("\n" + "="*60)
    print("📊 Data Verification")
    print("="*60)
    
    collections = ['schools', 'admissions_student', 'academics_programs', 
                   'costs_aid_completion', 'programs_field_of_study']
    
    for coll in collections:
        count = db[coll].count_documents({})
        print(f"{coll}: {count:,} documents")
    
    print("="*60)


def main():
    """Main import function"""
    print("\n" + "="*60)
    print("🚀 College Scorecard Data Import")
    print("="*60)
    
    # Create indexes first
    create_indexes()
    
    # Import data (adjust file paths as needed)
    # Note: You'll need to download and prepare your CSV files
    
    # Example:
    # import_schools_data('data/Most-Recent-Cohorts-Institution.csv')
    # import_costs_outcomes_data('data/Most-Recent-Cohorts-Institution.csv', 2024)
    
    print("\n⚠️  Note: Update this script with your actual CSV file paths")
    print("Download College Scorecard data from: https://collegescorecard.ed.gov/data/")
    
    # Verify imported data
    verify_data()
    
    print("\n✓ Import process complete!")


if __name__ == '__main__':
    main()
