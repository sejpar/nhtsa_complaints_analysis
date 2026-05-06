import requests
import pandas as pd
import time

def fetch_suv_data(vehicles, years):
    all_data = []
    
    for year in years:
        for v in vehicles:
            make, model = v['make'], v['model']
            print(f"Fetching: {year} {make} {model}...")
            
            url = f"https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}"
            
            try:
                response = requests.get(url)
                if response.status_code == 200:
                    results = response.json().get('results', [])
                    if results:
                        df = pd.DataFrame(results)
                        # 분석을 위해 연도/브랜드/모델 정보 컬럼 고정
                        df['meta_year'] = year
                        df['meta_make'] = make
                        df['meta_model'] = model
                        all_data.append(df)
                
                # API 서버 부하 방지를 위한 짧은 휴식
                time.sleep(0.2) 
            except Exception as e:
                print(f"Error fetching {year} {make} {model}: {e}")

    if all_data:
        return pd.concat(all_data, ignore_index=True)
    return pd.DataFrame()

# 대상 모델 및 연도 설정
target_suvs = [
    {"make": "Toyota", "model": "RAV4"},
    {"make": "Honda", "model": "CR-V"},
    {"make": "Chevrolet", "model": "Equinox"},
    {"make": "Ford", "model": "Explorer"},
    {"make": "Tesla", "model": "Model Y"}
]
target_years = range(2022, 2027) # 2022, 2023, 2024, 2025, 2026

# 실행
df_complaints = fetch_suv_data(target_suvs, target_years)

print(f"\n총 데이터 수: {len(df_complaints)}건")
# 간단한 확인: 모델별/연도별 데이터 분포
print(df_complaints.groupby(['meta_model', 'meta_year']).size().unstack(fill_value=0))

