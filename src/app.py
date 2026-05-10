import requests
import pandas as pd
import time
import streamlit as st
import matplotlib.pyplot as plt
import seaborn as sns

@st.cache_data
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

def finalize_categorization(x):
    x = str(x).upper()
    
    # 1. 안전 및 주행 보조 (최근 이슈가 많은 ADAS)
    if any(k in x for k in ['COLLISION', 'LANE DEPARTURE', 'BACK OVER', 'SPEED CONTROL']):
        return 'Driving Assist (ADAS)'
    
    # 2. 조향 (가장 많은 데이터)
    if 'STEERING' in x:
        return 'Steering & Handling'
    
    # 3. 엔진 및 구동계
    if any(k in x for k in ['ENGINE', 'POWER TRAIN', 'FUEL']):
        return 'Engine & Powertrain'
    
    # 4. 제동 및 안전
    if any(k in x for k in ['BRAKES', 'AIR BAGS']):
        return 'Brakes & Safety'
    
    # 5. 전기 장치
    if 'ELECTRICAL' in x:
        return 'Electrical & IT'
    
    # 6. 외장 및 시야
    if any(k in x for k in ['VISIBILITY', 'WIPER', 'LIGHTING', 'STRUCTURE']):
        return 'Exterior & Visibility'
    
    return 'Others'

# 새로운 컬럼에 적용
df_complaints['clean_category'] = df_complaints['components'].apply(finalize_categorization)

# 결과 확인
print(df_complaints['clean_category'].value_counts())

# 예시 코드: 위험 등급 분류------------------------ 라벨링
def classify_criticality(row):
    # 1. 값을 가져와서 일단 문자열로 변환 (NaN 방지)
    fire_val = str(row['fire']).strip().upper()
    crash_val = str(row['crash']).strip().upper()
    
    # 2. 'TRUE', 'T', '1', 'Y' 등 참을 의미할 수 있는 모든 문자열 체크
    is_fire = fire_val in ['TRUE', 'T', '1', 'Y', 'YES']
    is_crash = crash_val in ['TRUE', 'T', '1', 'Y', 'YES']
    
    # 3. 우선순위에 따라 라벨링
    if is_fire:
        return 'Fire'
    if is_crash:
        return 'Crash'
    return 'Other'

# 적용
df_complaints['criticality'] = df_complaints.apply(classify_criticality, axis=1)

#---------------------------------------------------그래프 구현--------------

st.set_page_config(page_title="Car Safety Insights", layout="wide")

st.title("SUV Safety & Complaint Dashboard")
st.markdown("NHTSA 데이터를 기반으로 차량의 고질병을 분석합니다.")


# --------------------------------------------------- 사이드바 필터 영역 -------------------

# 1. 모델 선택 (기존 코드)
target_model = st.sidebar.selectbox("차량을 선택하세요", ["CR-V", "RAV4", "Equinox", "Explorer", "Model Y"])

# 2. 연도 선택 (추가된 멀티플 초이스)
# 데이터 내에 존재하는 연도들을 중복 없이 가져와 내림차순으로 정렬합니다.
available_years = sorted(df_complaints['meta_year'].unique(), reverse=True)

selected_years = st.sidebar.multiselect(
    "분석할 연식(Model Year)을 선택하세요",
    options=available_years,
    default=available_years  # 처음에는 모든 연도가 선택되어 있도록 설정
)

# 3. 아무것도 선택하지 않았을 때의 방어 로직
if not selected_years:
    st.sidebar.warning("최소 하나 이상의 연도를 선택해 주세요!")
    st.stop() # 아래 코드 실행을 중단하고 경고 메시지만 띄움

# --------------------------------------------------- 데이터 필터링 업데이트 -------------------

# 모델과 선택된 연도들을 동시에 만족하는 데이터만 추출
df_target = df_complaints[
    (df_complaints['meta_model'] == target_model) & 
    (df_complaints['meta_year'].isin(selected_years))
]

st.subheader(f"📊 {target_model} ({', '.join(map(str, selected_years))}) 결함 리포트")


# 1단계: 빼빼로 바 차트 (Plotly 추천 - 클릭 이벤트 감지에 유리)
import plotly.express as px

fig = px.bar(df_target, x="clean_category", color="criticality", 
             title="부품별 위험 케이스 (Fire/Crash)",
             color_discrete_map={'Fire':'#E74C3C', 'Crash':'#F39C12', 'Other':"#99B8CC"})
st.plotly_chart(fig)

# --------------------------------------------------- 2단계: 세부 분석 (파이 차트) -------------------

st.divider()

# 1. 분석할 카테고리 선택
# 바 차트에서 대분류로 묶었던 'clean_category' 중 하나를 선택합니다.
selected_category = st.selectbox(
    "🔍 더 자세히 들여다볼 결함 카테고리를 선택하세요", 
    options=df_target['clean_category'].unique()
)

if selected_category:
    # 2. 선택된 카테고리로 데이터 필터링
    df_sub = df_target[df_target['clean_category'] == selected_category]
    
    st.subheader(f"📍 {selected_category} 내부의 세부 구성 요소 비중")
    
    # 3. 파이 차트 데이터 준비
    # 'components' 컬럼에는 'STEERING', 'STEERING:COLUMN' 등 원본 정보가 들어있습니다.
    # 이를 카운트하여 상위 7개를 보여줍니다.
    pie_data = df_sub['components'].value_counts().head(7).reset_index()
    pie_data.columns = ['Sub-Component', 'Count']

    # 4. 파이 차트(도넛 형태) 시각화
    fig_pie = px.pie(
        pie_data, 
        values='Count', 
        names='Sub-Component',
        hole=0.4,
        color_discrete_sequence=px.colors.sequential.Tealgrn,
        title=f"'{selected_category}' 내 실제 신고 항목 분포"
    )
    
    fig_pie.update_traces(textposition='inside', textinfo='percent+label')
    fig_pie.update_layout(showlegend=False, margin=dict(t=30, b=0, l=0, r=0))

    st.plotly_chart(fig_pie, use_container_width=True)

    # --------------------------------------------------- 3단계: 상세 컴플레인 리스트 -------------------
    
    st.subheader(f"📝 {selected_category} 관련 고객 목소리 (Summary)")
    st.info(f"선택하신 {selected_category} 카테고리에 대해 총 {len(df_sub)}건의 신고가 접수되었습니다.")

    # 최신순 정렬 (dateComplaintFiled 활용)
    df_sub = df_sub.sort_values(by='dateComplaintFiled', ascending=False)

    # 가독성을 위해 상위 15개만 리스트업
    for i, row in df_sub.head(15).iterrows():
        # 위험도에 따른 아이콘 설정
        icon = "⚪"
        if row['fire']: icon = "🔥"
        elif row['crash']: icon = "💥"
        
        # 날짜 포맷팅 (데이터가 문자열이므로 앞부분 날짜만 추출)
        date_str = str(row['dateOfIncident'])[:10] if row['dateOfIncident'] else "날짜 미상"
        
        with st.expander(f"{icon} [사례 {i}] | 발생일: {date_str} | 부품: {row['components']}"):
            # 주요 수치 강조
            col1, col2, col3 = st.columns(3)
            col1.metric("부상자 수", row['numberOfInjuries'])
            col2.metric("사망자 수", row['numberOfDeaths'])
            col3.write(f"**화재 여부:** {row['fire']} | **충돌 여부:** {row['crash']}")
            
            st.divider()
            st.write(f"**전체 요약(Summary):**")
            st.write(row['summary'])