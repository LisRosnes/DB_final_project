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
    
    # Schools collection indexes (minimal set for a small dataset)
    print("- Creating schools indexes...")
    db.schools.create_index([('school_id', 1)], unique=True)
    db.schools.create_index([('school.name', 'text'), ('school.alias', 'text')])
    # Keep only the fields used frequently in filters/searches. The dataset is
    # small so compound or many single-field indexes are not required.
    db.schools.create_index([('school.state', 1)])
    db.schools.create_index([('latest.cost.tuition.in_state', 1)])
    db.schools.create_index([('latest.admissions.admission_rate.overall', 1)])
    db.schools.create_index([('latest.student.size', 1)])
    
    # Admissions_student collection indexes
    print("- Creating admissions_student indexes...")
    # minimal: used to look up admissions for a school & year
    db.admissions_student.create_index([('school_id', 1), ('year', -1)])
    
    # Academics_programs collection indexes
    print("- Creating academics_programs indexes...")
    # minimal: school+year lookups are used to retrieve program percentages
    db.academics_programs.create_index([('school_id', 1), ('year', -1)])
    
    # Costs_aid_completion collection indexes
    print("- Creating costs_aid_completion indexes...")
    # minimal: lookups and analytics by year, cost, and earnings
    db.costs_aid_completion.create_index([('school_id', 1), ('year', -1)])
    db.costs_aid_completion.create_index([('year', -1)])
    db.costs_aid_completion.create_index([('cost.avg_net_price.overall', 1)])
    db.costs_aid_completion.create_index([('earnings.10_yrs_after_entry.median', -1)])
    
    # Programs_field_of_study collection indexes
    print("- Creating programs_field_of_study indexes...")
    # minimal: retrieve programs by school+year, and look up program by cip code
    db.programs_field_of_study.create_index([('school_id', 1), ('year', -1)])
    db.programs_field_of_study.create_index([('programs.cip_code', 1), ('year', -1)])
    
    print("✓ All indexes created successfully!")
    print("Note: This uses a minimal set of indexes to reduce storage and write overhead; add additional indexes if performance becomes an issue for larger datasets.")


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
    This function maps common College Scorecard CSV column names into the
    `costs_aid_completion` document schema used by the application. It tries
    multiple column name variants for each field, and stores a small `_raw`
    object with the original values which were found for debugging.

    Supported mappings (non-exhaustive):
    - cost.tuition.in_state: TUITIONFEE_IN (or TUITION_FEE_IN)
    - cost.tuition.out_of_state: TUITIONFEE_OUT
    - cost.avg_net_price.overall: NPT4_PUB or NPT4_PRIV
    - earnings.10_yrs_after_entry.median: MD_EARN_WNE_P10
    - completion.completion_rate_4yr_150nt: C150_4
    - aid.pell_grant_rate: PCTPELL
    - aid.federal_loan_rate: PCTFLOAN
    - aid.loan_principal: LOAN_PRINCIPAL
    - aid.median_debt.completers.overall: DEBT_MDN
    - repayment.3_yr_default_rate: RPY_3YR

    """
    print(f"\nImporting costs/outcomes data for year {year} from {csv_file}...")
    
    df = pd.read_csv(csv_file)
    
    documents = []
    for _, row in df.iterrows():
        # Safe helpers to pick the first present column from possible names
        def pick(*cols):
            for c in cols:
                if c in row and pd.notna(row.get(c)):
                    return row.get(c)
            return None

        def to_float(v):
            try:
                return float(v) if pd.notna(v) else None
            except Exception:
                return None

        # Basic mapping
        unitid = int(row['UNITID']) if 'UNITID' in row and pd.notna(row.get('UNITID')) else None

        # Cost mapping (tuition & avg_net_price)
        tuition_in = pick('TUITIONFEE_IN', 'TUITION_FEE_IN', 'TUITION_IN')
        tuition_out = pick('TUITIONFEE_OUT', 'TUITION_FEE_OUT', 'TUITION_OUT')
        avg_net_price_overall = pick('NPT4_PUB', 'NPT4_PRIV', 'AVG_NET_PRICE')
        books = pick('BOOKS', 'BOOKS_SUPPLY', 'BOOKS_SUPPLY_COST')
        room_oncampus = pick('ROOM_BD_ON', 'ROOMBOARD_ON', 'ROOMBOARD_ONCAMPUS', 'ROOMBOARD')
        room_offcampus = pick('ROOM_BD_OFF', 'ROOMBOARD_OFF', 'ROOMBOARD_OFFCAMPUS')
        otherexpense = pick('OTHER_EXPENSE', 'OTHER_EXP')

        # Earnings mapping
        earnings_10yr = pick('MD_EARN_WNE_P10', 'MD_EARN_WNE_P10_RT', 'MD_EARN_WNE_P10')
        earnings_6yr = pick('MD_EARN_WNE_P6', 'MD_EARN_WNE_P6')

        # Completion mapping
        completion_4yr = pick('C150_4', 'C150_4')
        completion_overall = pick('C150_L4', 'C150_L4')

        # Aid mapping
        pell_rate = pick('PCTPELL', 'PCTPELL', 'PELL_GRANT_RATE')
        federal_loan_rate = pick('PCTFLOAN', 'PCT_FED_LOAN', 'FEDERAL_LOAN_RATE')
        loan_principal = pick('LOAN_PRINCIPAL', 'LOAN_PRINCIPAL_MEDIAN')
        median_debt = pick('DEBT_MDN', 'DEBT_MDN', 'MD_EARN_DEBT')
        median_debt_suppressed = pick('DEBT_MDN_SUPP', 'MEDIAN_DEBT_SUPP', 'DEBT_MDN_SUPPRESSED')
        ftft_pell_rate = pick('FTFT_PCTPELL', 'FTFT_PELL_RATE')
        ftft_federal_loan_rate = pick('FTFT_PCTFLOAN', 'FTFT_FEDERAL_LOAN_RATE')

        # Repayment
        repayment_3yr = pick('RPY_3YR', 'REPAYMENT_3YR', '3YR_DEFAULT_RATE', '3_yr_default_rate')

        doc = {
            'school_id': unitid,
            'year': year,
            'cost': {
                'tuition': {
                    'in_state': to_float(tuition_in),
                    'out_of_state': to_float(tuition_out)
                },
                'avg_net_price': {
                    'overall': to_float(avg_net_price_overall)
                },
                'booksupply': to_float(books),
                'roomboard': {
                    'oncampus': to_float(room_oncampus),
                    'offcampus': to_float(room_offcampus)
                },
                'otherexpense': to_float(otherexpense)
            },
            'earnings': {
                '10_yrs_after_entry': {
                    'median': to_float(earnings_10yr)
                },
                '6_yrs_after_entry': {
                    'median': to_float(earnings_6yr)
                }
            },
            'completion': {
                'completion_rate_4yr_150nt': to_float(completion_4yr),
                'completion_rate_overall': to_float(completion_overall)
            },
            'aid': {
                'pell_grant_rate': to_float(pell_rate),
                'federal_loan_rate': to_float(federal_loan_rate),
                'loan_principal': to_float(loan_principal),
                'median_debt': {
                    'completers': {
                        'overall': to_float(median_debt)
                    }
                },
                'median_debt_suppressed': {
                    'overall': to_float(median_debt_suppressed)
                },
                'ftft_pell_grant_rate': to_float(ftft_pell_rate),
                'ftft_federal_loan_rate': to_float(ftft_federal_loan_rate)
            },
            'repayment': {
                '3_yr_default_rate': to_float(repayment_3yr)
            }
        }

        # Optional: attach a small `raw` map of values that were present in row used by this doc
        doc['_raw'] = {
            'tuition_in': tuition_in,
            'tuition_out': tuition_out,
            'avg_net_price_overall': avg_net_price_overall,
            'earnings_10yr': earnings_10yr,
            'earnings_6yr': earnings_6yr,
            'completion_4yr': completion_4yr,
            'completion_overall': completion_overall,
            'pell_rate': pell_rate,
            'federal_loan_rate': federal_loan_rate,
            'loan_principal': loan_principal,
            'median_debt': median_debt,
            'median_debt_suppressed': median_debt_suppressed,
            'ftft_pell_rate': ftft_pell_rate,
            'ftft_federal_loan_rate': ftft_federal_loan_rate,
            'repayment_3yr': repayment_3yr
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
