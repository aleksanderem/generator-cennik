# Design Guidelines - Beauty Audit

## Wzorcowe karty Bento

Trzy karty z sekcji "Jak działa generator cennika" są wzorem dla wszystkich kart na stronie.

### Wspólne cechy wizualne:

1. **Kontener karty:**
   - `rounded-2xl bg-white`
   - Shadow wielowarstwowy: `shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]`
   - `overflow-hidden`

2. **Górna część (wizualizacja):**
   - Wysokość: `h-56`
   - Maskowanie: `[mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]`
   - Perspektywa 3D: `perspective: 800px` lub `1000px`

3. **Transformacje 3D:**
   - `rotateX(20-30deg) rotateY(-20 do 20deg) rotateZ(-20 do 15deg)`
   - Efekt głębi i dynamiki

4. **Dolna część (tekst):**
   - `p-5`
   - Tytuł: `font-sans text-base font-semibold tracking-tight text-slate-800`
   - Opis: `mt-2 text-sm text-slate-500 leading-relaxed`

### Wzorce użycia:

#### Przed/Po (Transformacja):
- Nakładane warstwy z przesunięciem (z-10, z-20, z-30)
- Kolory stanów:
  - Surowe dane: czerwony (`border-red-200`, `text-red-400`)
  - W trakcie: złoty (`border-[#D4A574]`, `text-[#D4A574]`)
  - Gotowe: zielony (`border-green-300`, `text-green-600`)
- Badge'e statusu z ikonami

#### Timeline/Proces (Szybkość):
- Lista kroków z checkmarkami
- Czas wykonania przy każdym kroku
- Spinner dla aktywnego kroku
- Gradientowe separatory

#### Źródła/Integracje (Z dowolnego źródła):
- Centralny element z ikoną
- Orbitujące ikony źródeł
- Koncentryczne okręgi w tle
- Animacja `animate-orbit`

### Kolory projektu:
- Primary: `#171717` (ciemny)
- Accent: `#D4A574` (złoty)
- Success: green-500/600
- Warning: amber-500/600
- Error: red-400/500

### Typografia:
- Font główny: Inter
- Font dekoracyjny: Shadows Into Light Two (dla adnotacji)
- Font elegancki: Birthstone (dla logo/akcentów)
