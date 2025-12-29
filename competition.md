Specyfikacja: Competitive Discovery + Similarity Engine (Booksy)

Cel
1.	Znaleźć faktyczną konkurencję (taką, która realnie zabiera rezerwacje).
2.	Porównać jak 1:1 usługi (żeby benchmark ceny/czasu/yield miał sens).
3.	Wypluć gotowy output do raportu + Action Engine (priorytety i rekomendacje).

⸻

0) Dane wejściowe (kontrakt danych)

Dla salonu (business)
•	id
•	name
•	location.coordinate.latitude
•	location.coordinate.longitude
•	business_categories[].slug (lub name, ale slug lepszy)
•	service_categories[].services[].variants[]:
•	name/label
•	price (PLN)
•	duration (min)
•	opcjonalnie: description, photos
•	reputacja:
•	reviews_count
•	reviews_stars
•	(opcjonalnie) reviews[] z datą i treścią
•	“tarcie rezerwacji”:
•	simplified_booking_feature_checklist.has_payments
•	has_prepayment
•	has_cancellation_fee
•	accept_booksy_pay

⸻

1) Candidate Discovery (skąd brać kandydatów)

1.1 Źródła kandydatów
•	Booksy marketplace (najważniejsze): wyniki wyszukiwań po lokacji i klastrach usług.
•	Opcjonalnie: Google Maps / social (jeśli chcesz konkurencję poza Booksy).

1.2 Jak zbierać w Booksy

Robisz wyszukiwanie per klaster (laser/nails/facial/body/…), np. top 50 wyników.
Kandydaci = union wszystkich wyników, deduplikacja po business.id.

⸻

2) Preprocessing (żeby porównania były sensowne)

2.1 Normalizacja usług (variant-level)

Dla każdego wariantu tworzysz metryki:

A) Sessions w pakiecie

Jeśli nazwa ma “5 zabiegów / 10x / 3 wizyty”, wyciągasz:
•	sessions = extracted_number
•	jeśli brak → sessions = 1

Reguła (regex przykładowo):
•	(\d+)\s*(zabieg|zabiegów|wizyt|sesj|sesji|x)\b

B) Price per session
•	price_per_session = price / sessions (jeśli price != null)

C) Yield (PLN/min)
•	yield = price_per_session / duration_minutes

To jest krytyczne, bo bez korekty na pakiety “6 zabiegów” porównania cen są fałszywe.

⸻

2.2 Klastry usług (service clustering)

Wersja deterministyczna (heurystyka słownikowa):

Przykład słownika (możesz rozbudować):
•	laser: [“laser”, “depilacja laserowa”, “thunder”, “diode”]
•	nails: [“manicure”, “pedicure”, “hybryd”, “żel”, “paznok”]
•	facial: [“twarz”, “oczyszcz”, “peeling”, “mezoterap”, “kwas”, “lifting”]
•	body: [“endermolog”, “drenaż”, “modelowanie”, “cellulit”, “masaż”, “lipoliza”]
•	waxing: [“wosk”, “depilacja woskiem”, “wax”]
•	brows_lashes: [“brwi”, “henna”, “laminacja”, “rzęsy”, “lifting rzęs”]
•	other: fallback

Dla salonu liczysz:
•	clusters_set = zbiór klastrów, które w ogóle występują w menu
•	cluster_stats per klaster: liczba wariantów, median yield, median price/session

⸻

3) Similarity: salon↔salon (wybór konkurencji)

Każdy komponent w skali 0–1, a potem ważona suma.

3.1 Geo similarity (dystans)
1.	liczysz dystans km (Haversine)
2.	zamieniasz na podobieństwo:

s_{geo} = \max(0,\ 1 - \frac{d}{R})
•	d = dystans km
•	R = promień sensownego wyboru klienta (możesz różnicować per klaster):
•	nails: 3–5 km
•	laser/med-est: 5–8 km

⸻

3.2 Category similarity (typ biznesu)

Jaccard na business_categories.slug:

s_{cat} = \frac{|C_A \cap C_B|}{|C_A \cup C_B|}

⸻

3.3 Offer similarity (overlap klastrów usług)

Jaccard na clusters_set:

s_{offer} = \frac{|K_A \cap K_B|}{|K_A \cup K_B|}

⸻

3.4 Segment/price similarity (poziom cenowy)

Na medianie yield (PLN/min) — stabilniejsze niż “średnia cena”.

s_{price} = e^{-|\ln(\frac{y_A}{y_B})|}
•	y_A = median_yield salonu A
•	y_B = median_yield salonu B

⸻

3.5 Trust similarity (siła reputacji)

Najpierw trust score:

t = \ln(1 + reviews\_count) \cdot \frac{reviews\_stars}{5}

Potem podobieństwo:

s_{trust} = 1 - \frac{|t_A - t_B|}{\max(t_A, t_B)}

⸻

3.6 Booking/friction similarity

Weź wektor booleanów:
v = [has_payments, has_prepayment, has_cancellation_fee, accept_booksy_pay]

s_{book} = 1 - \frac{Hamming(v_A, v_B)}{len(v)}

⸻

3.7 Końcowy score konkurencji

score = w_g s_{geo} + w_c s_{cat} + w_o s_{offer} + w_p s_{price} + w_t s_{trust} + w_b s_{book}

Rekomendowane wagi (praktyczne):
•	w_geo=0.30
•	w_cat=0.20
•	w_offer=0.25
•	w_price=0.15
•	w_trust=0.05
•	w_book=0.05

⸻

4) Filtering i wybór “faktycznej konkurencji”

4.1 Filtry twarde (przed scoringiem)
•	d <= R_max (np. 8 km)
•	s_offer >= 0.25 (musi być choć częściowy overlap usług)
•	opcjonalnie: s_cat >= 0.10 (żeby odsiać totalne inne branże)

4.2 Koszyki konkurencji (po scoringu)
•	Direct competitors: top N (np. 5–10) po score
•	Cluster direct: top N per klaster (laser/nails/facial…)
•	Aspirational: score wysokie, ale segment wyraźnie droższy (np. median_yield > 1.4x)

⸻

5) Similarity: usługa↔usługa (benchmark 1:1)

Cel: dla każdej kluczowej usługi Beauty4ever znaleźć najlepszy odpowiednik u konkurenta.

5.1 Zawężenie kandydatów

Tylko usługi z tego samego klastra (np. laser ↔ laser).

5.2 Składniki podobieństwa usługi (0–1)

A) Text similarity (nazwa)

Opcja deterministyczna i dobra:
•	TF-IDF na nazwach + cosine similarity

s_{text} = cos(tfidf(name_A), tfidf(name_B))

Alternatywa uproszczona (gorsza): token Jaccard.

B) Time similarity

s_{time} = e^{-\frac{|dur_A - dur_B|}{\tau}}
•	τ np. 30 minut

C) Price similarity (price per session)

s_{ps} = e^{-|\ln(\frac{pps_A}{pps_B})|}

5.3 Match score usługi

match = 0.70 s_{text} + 0.15 s_{time} + 0.15 s_{ps}

Dla każdej usługi A wybierasz B z maksymalnym match.
Dodatkowo możesz mieć próg:
•	jeśli match < 0.45 → “no reliable match” (lepiej nie porównywać).

⸻

6) Output (co pipeline ma zwrócić)

6.1 Lista konkurentów (overall)

{
"subject_business_id": "beauty4ever_id",
"direct_competitors": [
{
"business_id": "yoazo_id",
"name": "YOAZO CLINIC",
"distance_km": 7.02,
"similarity": {
"geo": 0.122,
"category": 0.50,
"offer": 0.857,
"price": 0.576,
"trust": 0.531,
"booking": 0.75
},
"score": 0.50,
"segment": {
"median_yield": 7.78,
"median_price_per_session": 200
}
}
],
"competitors_by_cluster": {
"laser": ["..."],
"nails": ["..."]
}
}

6.2 Benchmark salon↔salon
•	opinie (count, stars, trust_score)
•	size of menu (categories/services/variants)
•	storefront (desc_len, staff profiles completeness, photo counts)
•	booking flags
•	mediany: median_price_per_session, median_yield

6.3 Benchmark klaster↔klaster

Dla każdego klastra:
•	count_variants
•	median_price_per_session
•	median_yield
•	percentyle vs konkurencja (np. “jesteś w 20% najtańszych”)

6.4 Matchups usługa↔usługa

Dla kluczowych usług:
•	najlepszy odpowiednik u konkurenta
•	różnica ceny/czasu/yield
•	gotowa reguła do Action Engine (“podnieś cenę” / “skróć czas” / “wzmocnij opis”)

⸻

7) Konfiguracja jako JSON (żeby to było sterowalne)

{
"radius_km": {
"default": 8,
"nails": 5,
"laser": 8,
"facial": 6,
"body": 8
},
"weights_business_similarity": {
"geo": 0.30,
"category": 0.20,
"offer": 0.25,
"price": 0.15,
"trust": 0.05,
"booking": 0.05
},
"thresholds": {
"min_offer_jaccard": 0.25,
"min_category_jaccard": 0.10,
"min_service_match": 0.45
},
"service_match_weights": {
"text": 0.70,
"time": 0.15,
"price_per_session": 0.15
},
"time_tau_minutes": 30,
"cluster_keywords": {
"laser": ["laser", "depilacja laserowa", "thunder", "diode"],
"nails": ["manicure", "pedicure", "hybryd", "żel", "paznok"],
"facial": ["twarz", "oczyszcz", "peeling", "mezoterap", "kwas", "lifting"],
"body": ["endermolog", "drenaż", "modelowanie", "cellulit", "masaż", "lipoliza"],
"waxing": ["wosk", "depilacja woskiem", "wax"],
"brows_lashes": ["brwi", "henna", "laminacja", "rzęsy", "lifting rzęs"]
},
"bundle_sessions_regex": "(\\d+)\\s*(zabieg|zabiegów|wizyt|sesj|sesji|x)\\b"
}


⸻

8) Minimalny algorytm (pseudokod)

INPUT: subject_business, candidate_businesses[]

subject_stats = preprocess(subject_business)

for each candidate in candidate_businesses:
cand_stats = preprocess(candidate)

if distance(subject, candidate) > R_max: continue
if offer_jaccard(subject, candidate) < min_offer: continue
if category_jaccard(subject, candidate) < min_cat: continue

score = weighted_sum(
geo_sim, cat_sim, offer_sim, price_sim, trust_sim, booking_sim
)

rank candidates by score desc
direct = top N

for each cluster in subject_stats.clusters:
cluster_direct[cluster] = top N among candidates with cluster overlap

for each key_service in subject (top by popularity or revenue proxy):
for each competitor in direct:
match = best_service_match(key_service, competitor_services_same_cluster)
store matchup
OUTPUT: competitors + benchmarks + matchups
