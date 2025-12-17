
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PricingData, AuditResult, Category, ServiceItem, IntegrationMode, OptimizationResult, OptimizationChange, CategorySuggestionsResult, CategorySuggestion } from "../types";

// Simple string hash function for cache keys
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const CACHE_PREFIX = 'bp_cache_v9_source_truth_'; // Version bump - source of truth rule
const AUDIT_CACHE_PREFIX = 'bp_audit_cache_v6_source_truth_';
const N8N_WEBHOOK_URL = "https://n8n.kolabogroup.pl/webhook/36fc010f-9dd1-4554-b027-3497525babe9";

// --- MOCK DATA FOR FALLBACK ---
// Full dataset provided by user (~150 items)
const MOCK_SCRAPED_DATA_FALLBACK = `[{"name":"Laser CO2 - usuwanie zmian skórnych (kurzajek, włókniaków, pieprzyków, zmian barwnikowych, plamek żółtych)","description":"Laserowe usuwanie zmian skórnych...","price":"150,00 zł+","duration":"30min"},{"name":"Konsultacja usuwanie zmian skórnych","description":"Zapraszamy na konsultację...","price":"Darmowa","duration":"15min"},{"name":"1 zabieg Endermologia Alliance","price":"300,00 zł","duration":"1g"},{"name":"-30% na Pierwszy zabieg Onda + konsultacja GRATIS","price":"Darmowa","duration":"1g"},{"name":"-50% na drugi zabieg oczyszczania wodorowego Inpure","price":"Darmowa","duration":"1g"},{"name":"-50% na Pierwszy zabieg Red Touch","price":"Darmowa","duration":"1g"},{"name":"Depilacja Laserowa Thunder - Kup 2 partie ➡️ trzecia za 1 zł","price":"Darmowa","duration":"30min"},{"name":"Drugi zabieg Embody GRATIS","price":"Darmowa","duration":"30min"},{"name":"Pierwsza zmiana skórna od 149zł + znieczulenie GRATIS","price":"Darmowa","duration":"30min"},{"name":"✦ Całe ciało - Kobieta - Depilacja laserowa Thunder - PROMOCJA","description":"Laser Thunder to najmocniejsza i najszybsza...","price":"2 000,00 zł","duration":"1g 15min"},{"name":"▫ Thunder - Bikini brazylijskie 4 zabiegi - Kobieta","price":"1 880,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini brazylijskie 6 zabiegów - Kobieta","price":"2 700,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini brazylijskie - Kobieta","price":"500,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini (pachwiny, wzgórek łonowy) 4 zabiegi - Kobieta","price":"1 760,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini (pachwiny, wzgórek łonowy) 6 zabiegów - Kobieta","price":"2 400,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini (pachwiny, wzgórek łonowy) - Kobieta","price":"460,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini pełne 4 zabiegi - Kobieta","price":"1 800,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini pełne 6 zabiegów - Kobieta","price":"2 520,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini pełne (pachwiny, wzgórek łonowy, wargi sromowe) - Kobieta","price":"480,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini podstawowe (pachwiny) 4 zabiegi - Kobieta","price":"1 520,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini podstawowe (pachwiny) 6 zabiegów - Kobieta","price":"2 100,00 zł","duration":"15min"},{"name":"▫ Thunder - Bikini podstawowe (pachwiny) - Kobieta","price":"400,00 zł","duration":"15min"},{"name":"▫ Thunder - brzuch/klatka piersiowa 4 zabiegi - Kobieta","price":"1 580,00 zł","duration":"30min"},{"name":"▫ Thunder - brzuch/klatka piersiowa 6 zabiegów - Kobieta","price":"2 100,00 zł","duration":"30min"},{"name":"▫ Thunder - brzuch/klatka piersiowa - Kobieta","price":"440,00 zł","duration":"30min"},{"name":"▫ Thunder - Całe ciało 4 zabiegi - Kobieta","price":"5 600,00 zł","duration":"1g 15min"},{"name":"▫ Thunder - Całe ciało 6 zabiegów - Kobieta","price":"7 800,00 zł","duration":"1g 15min"},{"name":"▫ Thunder - Całe nogi 4 zabiegi - Kobieta","price":"3 800,00 zł","duration":"45min"},{"name":"▫ Thunder - Całe nogi 6 zabiegów - Kobieta","price":"5 400,00 zł","duration":"45min"},{"name":"▫ Thunder - Całe nogi - Kobieta","price":"1 200,00 zł","duration":"45min"},{"name":"▫ Thunder - Całe ręce 4 zabiegi - Kobieta","price":"3 520,00 zł","duration":"30min"},{"name":"▫ Thunder - Całe ręce 6 zabiegów - Kobieta","price":"5 100,00 zł","duration":"30min"},{"name":"▫ Thunder - Całe ręce - Kobieta","price":"900,00 zł","duration":"30min"},{"name":"▫ Thunder - Dłonie 4 zabiegi - Kobieta","price":"1 120,00 zł","duration":"15min"},{"name":"▫ Thunder - Dłonie 6 zabiegów - Kobieta","price":"1 620,00 zł","duration":"15min"},{"name":"▫ Thunder - Dłonie - Kobieta","price":"290,00 zł","duration":"15min"},{"name":"▫Thunder - kark 4 zabiegi - Kobieta","price":"900,00 zł","duration":"10min"},{"name":"▫Thunder - kark 6 zabiegów - Kobieta","price":"1 200,00 zł","duration":"10min"},{"name":"▫Thunder - kark - Kobieta","price":"250,00 zł","duration":"10min"},{"name":"▫ Thunder - Kobieta - szyja 6 zabiegów","price":"1 250,00 zł","duration":"15min"},{"name":"▫ Thunder - linia biała 4 zabiegi - Kobieta","price":"1 120,00 zł","duration":"15min"},{"name":"▫ Thunder - linia biała 6 zabiegów - Kobieta","price":"1 620,00 zł","duration":"15min"},{"name":"▫ Thunder - linia biała - Kobieta","price":"290,00 zł","duration":"15min"},{"name":"▫ Thunder - Łydki + kolana 4 zabiegi - Kobieta","price":"2 720,00 zł","duration":"30min"},{"name":"▫ Thunder - Łydki + kolana 6 zabiegów - Kobieta","price":"3 900,00 zł","duration":"30min"},{"name":"▫ Thunder - Łydki + kolana - Kobieta","price":"700,00 zł","duration":"30min"},{"name":"▫ Thunder - okolica brodawek sutkowych 4 zabiegi - Kobieta","price":"1 120,00 zł","duration":"15min"},{"name":"▫ Thunder - okolica brodawek sutkowych 6 zabiegów - Kobieta","price":"1 620,00 zł","duration":"15min"},{"name":"▫ Thunder - okolica brodawek sutkowych - Kobieta","price":"290,00 zł","duration":"15min"},{"name":"▫ Thunder - pachy 4 zabiegi - Kobieta","price":"1 320,00 zł","duration":"15min"},{"name":"▫ Thunder - pachy 6 zabiegów - Kobieta","price":"1 800,00 zł","duration":"15min"},{"name":"Thunder - pachy + bikini brazylijskie + linia biała - 4 zabiegi","price":"2 400,00 zł","duration":"30min"},{"name":"▫ Thunder - pachy - Kobieta","price":"350,00 zł","duration":"15min"},{"name":"▫ Thunder - plecy 4 zabiegi - Kobieta","price":"1 580,00 zł","duration":"30min"},{"name":"▫ Thunder - plecy 6 zabiegów - Kobieta","price":"2 100,00 zł","duration":"30min"},{"name":"▫ Thunder - plecy - Kobieta","price":"440,00 zł","duration":"30min"},{"name":"▪ Thunder - Pośladki 4 zabiegi - Kobieta","price":"1 880,00 zł","duration":"20min"},{"name":"▫ Thunder - Pośladki 6 zabiegów - Kobieta","price":"2 700,00 zł","duration":"30min"},{"name":"▫ Thunder - Pośladki - Kobieta","price":"500,00 zł","duration":"30min"},{"name":"▫ Thunder - Przedramiona 4 zabiegi - Kobieta","price":"1 880,00 zł","duration":"15min"},{"name":"▫ Thunder - Przedramiona 6 zabiegów - Kobieta","price":"2 700,00 zł","duration":"15min"},{"name":"▫ Thunder - Przedramiona - Kobieta","price":"500,00 zł","duration":"15min"},{"name":"▫ Thunder - Ramiona 4 zabiegi - Kobieta","price":"2 320,00 zł","duration":"15min"},{"name":"▫ Thunder - Ramiona 6 zabiegów - Kobieta","price":"3 300,00 zł","duration":"15min"},{"name":"▫ Thunder - Ramiona - Kobieta","price":"600,00 zł","duration":"15min"},{"name":"▫ Thunder - Stopy 4 zabiegi - Kobieta","price":"1 120,00 zł","duration":"15min"},{"name":"▫ Thunder - Stopy 6 zabiegów - Kobieta","price":"1 620,00 zł","duration":"15min"},{"name":"▫ Thunder - Stopy - Kobieta","price":"290,00 zł","duration":"15min"},{"name":"▫ Thunder - Szpara pośladkowa 4 zabiegi - Kobieta","price":"770,00 zł","duration":"15min"},{"name":"▫ Thunder - Szpara pośladkowa 6 zabiegów - Kobieta","price":"1 145,00 zł","duration":"15min"},{"name":"▫ Thunder - Szpara pośladkowa - Kobieta","price":"250,00 zł","duration":"15min"},{"name":"▫ Thunder - szyja 4 zabiegi - Kobieta","price":"750,00 zł","duration":"30min"},{"name":"▫ Thunder - szyja - Kobieta","price":"220,00 zł","duration":"30min"},{"name":"▫ Thunder - twarz - broda/baki 4 zabiegi - Kobieta","price":"1 120,00 zł","duration":"30min"},{"name":"▫ Thunder - twarz - broda/baki 6 zabiegów - Kobieta","price":"1 560,00 zł","duration":"30min"},{"name":"▫ Thunder - twarz - broda/baki - Kobieta","price":"300,00 zł","duration":"30min"},{"name":"▫ Thunder - twarz - cała twarz 4 zabiegi - Kobieta","price":"1 880,00 zł","duration":"45min"},{"name":"▫ Thunder - twarz - cała twarz 6 zabiegów - Kobieta","price":"2 700,00 zł","duration":"45min"},{"name":"▫ Thunder - twarz - cała twarz - Kobieta","price":"500,00 zł","duration":"15min"},{"name":"▫ Thunder - twarz - górna warga 4 zabiegi - Kobieta","price":"1 120,00 zł","duration":"15min"},{"name":"▫ Thunder - twarz - górna warga 6 zabiegów - Kobieta","price":"1 560,00 zł","duration":"15min"},{"name":"▫ Thunder - twarz - górna warga - Kobieta","price":"300,00 zł","duration":"15min"},{"name":"▫ Thunder - twarz - policzki 4 zabiegi - Kobieta","price":"750,00 zł","duration":"30min"},{"name":"▫ Thunder - twarz - policzki 6 zabiegów - Kobieta","price":"1 250,00 zł","duration":"30min"},{"name":"▫ Thunder - twarz - policzki - Kobieta","price":"220,00 zł","duration":"30min"},{"name":"▫ Thunder - Uda 4 zabiegi - Kobieta","price":"3 520,00 zł","duration":"30min"},{"name":"▫ Thunder - Uda 6 zabiegów - Kobieta","price":"5 100,00 zł","duration":"15min"},{"name":"▫ Thunder - Uda + kolana 4 zabiegi - Kobieta","price":"1 250,00 zł","duration":"30min"},{"name":"▫ Thunder - Uda + kolana - Kobieta","price":"500,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini brazylijskie 4 zabiegi - Mężczyzna","price":"1 600,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini brazylijskie 6 zabiegów - Mężczyzna","price":"2 280,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini brazylijskie - Mężczyzna","price":"410,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini (pachwiny, wzgórek łonowy) 4 zabiegi - Mężczyzna","price":"1 400,00 zł","duration":"30min"},{"name":"▪ Thunder - bikini (pachwiny, wzgórek łonowy) 6 zabiegów - Mężczyzna","price":"1 980,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini (pachwiny, wzgórek łonowy) - Mężczyzna","price":"365,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini pełne 4 zabiegi - Mężczyzna","price":"1 450,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini pełne 6 zabiegów - Mężczyzna","price":"2 040,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini pełne - Mężczyzna","price":"380,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini podstawowe (pachwiny) 4 zabiegi - Mężczyzna","price":"1 300,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini podstawowe (pachwiny) 6 zabiegów - Mężczyzna","price":"1 860,00 zł","duration":"30min"},{"name":"▪ Thunder - Bikini podstawowe (pachwiny) - Mężczyzna","price":"340,00 zł","duration":"30min"},{"name":"▪ Thunder - brzuch/klatka piersiowa 4 zabiegi - Mężczyzna","price":"1 800,00 zł","duration":"45min"},{"name":"▪ Thunder - brzuch/klatka piersiowa 6 zabiegów - Mężczyzna","price":"2 580,00 zł","duration":"45min"},{"name":"▪ Thunder - brzuch/klatka piersiowa - Mężczyzna","price":"470,00 zł","duration":"45min"},{"name":"▪ Thunder - cała twarz 4 zabiegi - Mężczyzna","price":"2 160,00 zł","duration":"45min"},{"name":"▪ Thunder - cała twarz 6 zabiegów - Mężczyzna","price":"3 180,00 zł","duration":"45min"},{"name":"▪ Thunder - cała twarz - Mężczyzna","price":"550,00 zł","duration":"45min"},{"name":"▪ Thunder - Całe ciało 4 zabiegi - Mężczyzna","price":"7 499,00 zł","duration":"1g 30min"},{"name":"▪ Thunder - Całe ciało - Mężczyzna","price":"1 999,00 zł","duration":"1g 30min"},{"name":"▪ Thunder - Całe nogi 4 zabiegi - Mężczyzna","price":"3 120,00 zł","duration":"45min"},{"name":"▪ Thunder - Całe nogi 6 zabiegów - Mężczyzna","price":"4 560,00 zł","duration":"45min"},{"name":"▪ Thunder - Całe nogi - Mężczyzna","price":"800,00 zł","duration":"45min"},{"name":"▪ Thunder - Całe ręce 4 zabiegi - Mężczyzna","price":"1 920,00 zł","duration":"30min"},{"name":"▪ Thunder - Całe ręce 6 zabiegów - Mężczyzna","price":"2 820,00 zł","duration":"30min"},{"name":"▪ Thunder - Całe ręce - Mężczyzna","price":"490,00 zł","duration":"30min"},{"name":"▪ Thunder - Dłonie 4 zabiegi - Mężczyzna","price":"900,00 zł","duration":"15min"},{"name":"▪ Thunder - Dłonie 6 zabiegów - Mężczyzna","price":"1 275,00 zł","duration":"15min"},{"name":"▪ Thunder - Dłonie - Mężczyzna","price":"250,00 zł","duration":"15min"},{"name":"▪ Thunder - linia biała 4 zabiegi - Mężczyzna","price":"760,00 zł","duration":"15min"},{"name":"▪ Thunder - linia biała 6 zabiegów - Mężczyzna","price":"1 080,00 zł","duration":"15min"},{"name":"▪ Thunder - linia biała - Mężczyzna","price":"200,00 zł","duration":"15min"},{"name":"▪ Thunder - Łydki 4 zabiegi - Mężczyzna","price":"1 560,00 zł","duration":"30min"},{"name":"▪ Thunder - Łydki 6 zabiegów - Mężczyzna","price":"2 280,00 zł","duration":"30min"},{"name":"▪ Thunder - Łydki + kolana 4 zabiegi - Mężczyzna","price":"1 640,00 zł","duration":"30min"},{"name":"▪ Thunder - Łydki + kolana 6 zabiegów - Mężczyzna","price":"2 400,00 zł","duration":"30min"},{"name":"▪ Thunder - Łydki + kolana - Mężczyzna","price":"420,00 zł","duration":"30min"},{"name":"▪ Thunder - Łydki - Mężczyzna","price":"400,00 zł","duration":"30min"},{"name":"▪ Thunder - okolica brodawek sutkowych 4 zabiegi - Mężczyzna","price":"760,00 zł","duration":"15min"},{"name":"▪ Thunder - okolica brodawek sutkowych 6 zabiegów - Mężczyzna","price":"1 080,00 zł","duration":"15min"},{"name":"▪ Thunder - okolica brodawek sutkowych - Mężczyzna","price":"200,00 zł","duration":"15min"},{"name":"▪ Thunder - pachy/kark 4 zabiegi - Mężczyzna","price":"1 160,00 zł","duration":"15min"},{"name":"▪ Thunder - pachy/kark 6 zabiegów - Mężczyzna","price":"1 680,00 zł","duration":"15min"},{"name":"▪ Thunder - pachy/kark - Mężczyzna","price":"300,00 zł","duration":"15min"},{"name":"▪ Thunder - Palce u dłoni 4 zabiegi - Mężczyzna","price":"720,00 zł","duration":"15min"},{"name":"▪ Thunder - Palce u dłoni 6 zabiegów - Mężczyzna","price":"1 056,00 zł","duration":"15min"},{"name":"▪ Thunder - Palce u dłoni - Mężczyzna","price":"200,00 zł","duration":"15min"},{"name":"▪ Thunder - Palce u stóp 4 zabiegi - Mężczyzna","price":"840,00 zł","duration":"15min"},{"name":"▪ Thunder - Palce u stóp 6 zabiegów - Mężczyzna","price":"1 200,00 zł","duration":"15min"},{"name":"▪ Thunder - Palce u stóp - Mężczyzna","price":"220,00 zł","duration":"15min"},{"name":"▪ Thunder - plecy 4 zabiegi - Mężczyzna","price":"1 960,00 zł","duration":"45min"},{"name":"▪ Thunder - plecy 6 zabiegów - Mężczyzna","price":"2 880,00 zł","duration":"45min"},{"name":"▪ Thunder - plecy - Mężczyzna","price":"500,00 zł","duration":"45min"},{"name":"▪ Thunder - Pośladki 4 zabiegi - Mężczyzna","price":"1 360,00 zł","duration":"30min"},{"name":"▪ Thunder - Pośladki 6 zabiegów - Mężczyzna","price":"1 920,00 zł","duration":"30min"},{"name":"▪ Thunder - Pośladki - Mężczyzna","price":"360,00 zł","duration":"30min"},{"name":"▪ Thunder - Przedramiona 4 zabiegi - Mężczyzna","price":"1 360,00 zł","duration":"15min"},{"name":"▪ Thunder - Przedramiona 6 zabiegów - Mężczyzna","price":"1 980,00 zł","duration":"15min"},{"name":"▪ Thunder - Przedramiona - Mężczyzna","price":"350,00 zł","duration":"15min"},{"name":"▪ Thunder - Ramiona 4 zabiegi - Mężczyzna","price":"1 360,00 zł","duration":"15min"},{"name":"▪ Thunder - Ramiona 6 zabiegów - Mężczyzna","price":"1 980,00 zł","duration":"15min"},{"name":"▪ Thunder - Ramiona - Mężczyzna","price":"350,00 zł","duration":"15min"},{"name":"▪ Thunder - Stopy 4 zabiegi - Mężczyzna","price":"800,00 zł","duration":"15min"},{"name":"▪ Thunder - Stopy 6 zabiegów - Mężczyzna","price":"900,00 zł","duration":"15min"},{"name":"▪ Thunder - Stopy - Mężczyzna","price":"240,00 zł","duration":"15min"},{"name":"▪ Thunder - Szpara pośladkowa 4 zabiegi - Mężczyzna","price":"840,00 zł","duration":"15min"},{"name":"▪ Thunder - Szpara pośladkowa 6 zabiegów - Mężczyzna","price":"1 200,00 zł","duration":"15min"},{"name":"▪ Thunder - Szpara pośladkowa - Mężczyzna","price":"220,00 zł","duration":"15min"},{"name":"▪ Thunder - szyja 4 zabiegi - Mężczyzna","price":"720,00 zł","duration":"30min"},{"name":"▪ Thunder - szyja 6 zabiegów - Mężczyzna","price":"1 010,00 zł","duration":"30min"},{"name":"▪ Thunder - szyja - Mężczyzna","price":"225,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - broda/baki 4 zabiegi - Mężczyzna","price":"760,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - broda/baki 6 zabiegów - Mężczyzna","price":"1 080,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - broda/baki - Mężczyzna","price":"200,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - górna warga 4 zabiegi - Mężczyzna","price":"760,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - górna warga 6 zabiegów - Mężczyzna","price":"1 080,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - górna warga - Mężczyzna","price":"200,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - okolica pomiędzy brwiami 4 zabiegi - Mężczyzna","price":"560,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - okolica pomiędzy brwiami 6 zabiegów - Mężczyzna","price":"780,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - okolica pomiędzy brwiami - Mężczyzna","price":"150,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - policzki 4 zabiegi - Mężczyzna","price":"720,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - policzki 6 zabiegów - Mężczyzna","price":"1 010,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - policzki - Mężczyzna","price":"225,00 zł","duration":"30min"},{"name":"▪ Thunder - twarz - uszy 4 zabiegi - Mężczyzna","price":"640,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - uszy 6 zabiegów - Mężczyzna","price":"900,00 zł","duration":"15min"},{"name":"▪ Thunder - twarz - uszy - Mężczyzna","price":"170,00 zł","duration":"15min"},{"name":"▪ Thunder - Uda 4 zabiegi - Mężczyzna","price":"1 920,00 zł","duration":"20min"},{"name":"▪ Thunder - Uda 6 zabiegów - Mężczyzna","price":"2 760,00 zł","duration":"20min"},{"name":"▪ Thunder - Uda + kolana 4 zabiegi - Mężczyzna","price":"2 000,00 zł","duration":"30min"},{"name":"▪ Thunder - Uda + kolana 6 zabiegów - Mężczyzna","price":"2 880,00 zł","duration":"30min"},{"name":"▪ Thunder - Uda + kolana - Mężczyzna","price":"510,00 zł","duration":"30min"},{"name":"▪ Thunder - Uda - Mężczyzna","price":"490,00 zł","duration":"20min"},{"name":"Kroplówka Beauty - Glow skin, Hair , Nails - Advanced","price":"700,00 zł","duration":"1g 30min"},{"name":"Kroplówka Beauty - Glow skin, Hair , Nails - Basic","price":"500,00 zł","duration":"1g 30min"},{"name":"Kroplówka Beauty - Glow skin, Hair , Nails - VIP","price":"700,00 zł","duration":"1g 30min"},{"name":"Kroplówka CEREBROLIZYNA TERAPIA - 10x Wspomaganie w leczeniu demencji, Alzheimera, po udarze","price":"5 000,00 zł","duration":"1g 30min"},{"name":"Kroplówka CEREBROLIZYNA TERAPIA - 1x Wspomaganie w leczeniu demencji, Alzheimera, po udarze","price":"700,00 zł","duration":"1g 30min"},{"name":"Kroplówka Detox, Alkohol, Używki - Anty kac","price":"500,00 zł","duration":"1g 30min"},{"name":"Kroplówka Detox, Alkohol, Używki - Detox","price":"700,00 zł","duration":"1g 30min"},{"name":"Kroplówka Detox, Alkohol, Używki - Regeneracja","price":"800,00 zł","duration":"1g 30min"},{"name":"Kroplówka NAD + ANTY-AGING - CelluNAD 500mg","price":"1 500,00 zł","duration":"1g 30min"},{"name":"Kroplówka NAD + ANTY-AGING - NAD + Boost 300mg","price":"1 000,00 zł","duration":"1g 30min"},{"name":"Kroplówka NAD + ANTY-AGING - NAD + Restore 500mg","price":"1 300,00 zł","duration":"1g 30min"},{"name":"Kroplówka NAD + ANTY-AGING - NAD + Vital 200mg","price":"800,00 zł","duration":"1g 30min"},{"name":"Kroplówka NAD + ANTY-AGING - NeuroNAD 300mg","price":"900,00 zł","duration":"1g 30min"},{"name":"Kroplówka NAD + ANTY-AGING - NeuroNAD VIP 500mg","price":"1 800,00 zł","duration":"1g 30min"},{"name":"Kroplówka Odporność - Advanced","price":"700,00 zł","duration":"1g 30min"},{"name":"Kroplówka Odporność - Basic","price":"500,00 zł","duration":"1g 30min"},{"name":"Kroplówka Odporność - VIP","price":"800,00 zł","duration":"1g 30min"},{"name":"Kroplówka Regeneracja ośrodkowego układu nerwowego","price":"800,00 zł","duration":"1g 30min"},{"name":"Kroplówka Sport - Gojenie","price":"800,00 zł","duration":"1g 30min"}]`;

// Recursive function to clean up AI hallucinations (like "null" strings)
const sanitizePricingData = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string' && (obj.toLowerCase() === 'null' || obj.toLowerCase() === 'undefined')) {
      return undefined;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizePricingData).filter(item => item !== undefined);
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = sanitizePricingData(obj[key]);
      
      if (key === 'imageUrl' && typeof value === 'string') {
        if (!value.startsWith('http')) {
          continue; 
        }
      }

      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
};

// Helper to convert JSON to TSV-like string for the editor (human readable)
// Guarantees 100% of items are preserved.
const convertJsonToTsv = (jsonString: string): string => {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) return jsonString;

    return data.map((item: any) => {
      // Basic formatting for the editor: Name | Price | Description | Duration
      // Using tabs or pipe+newline
      const parts = [
        item.name,
        item.price,
        item.description || "",
        item.duration || "",
        item.imageUrl || "" 
      ];
      // Filter out undefined and join with tabs
      return parts.join('\t');
    }).join('\n');
  } catch (e) {
    console.error("Error converting JSON to TSV", e);
    return jsonString; // Fallback to raw JSON if parse fails
  }
};

const parsePricingData = async (rawData: string, optimizationMode: boolean = false): Promise<PricingData> => {
  const cacheKey = CACHE_PREFIX + (optimizationMode ? 'optimized_' : 'raw_') + simpleHash(rawData.trim());
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    console.log("Returning cached result");
    try {
      return JSON.parse(cachedData) as PricingData;
    } catch (e) {
      console.warn("Cache parse error, proceeding to API");
      localStorage.removeItem(cacheKey);
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza API. Upewnij się, że environment variable API_KEY jest ustawiony.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // --- UPDATED SYSTEM INSTRUCTIONS ---
  
  const systemInstructionOriginal = `
    JESTEŚ PRECYZYJNYM PARSEREM DANYCH. 
    TWOJE JEDYNE ZADANIE: Przekonwertować tekst wejściowy na strukturę JSON.
    
    ZASADY (TRYB ORYGINAŁ):
    1. NIE ZMIENIAJ NAZW USŁUG (muszą być identyczne jak w źródle).
    2. NIE ŁĄCZ ANI NIE GRUPUJ USŁUG. Każdy wiersz wejścia = osobny obiekt wyjścia.
    3. NIE USUWAJ ŻADNYCH POZYCJI. Jeśli wejście ma 150 wierszy, wyjście ma mieć 150 obiektów.
    4. Zachowaj oryginalną kolejność.
    5. Po prostu przepisz dane do formatu JSON.
  `;

  const systemInstructionOptimized = `
    JESTEŚ EKSPERTEM PSYCHOLOGII SPRZEDAŻY w branży Beauty (Booksy).
    Twój cel: Ułatwić nowemu klientowi podjęcie decyzji ("Nie wiem co wybrać") oraz dać konkret stałemu klientowi ("Wiem czego szukam").

    ⚠️ BEZWZGLĘDNA ZASADA "SOURCE OF TRUTH":
    - CENNIK KLIENTA JEST JEDYNYM ŹRÓDŁEM PRAWDY
    - NIE WYMYŚLAJ NOWYCH USŁUG - możesz tylko pracować z tym, co jest w cenniku
    - ZAKAZ tworzenia usług, które nie istnieją w oryginale
    - Możesz ZMNIEJSZAĆ liczbę usług (przez grupowanie/łączenie wariantów)
    - Możesz DUPLIKOWAĆ usługę do różnych kategorii (to jedyny przypadek "zwiększenia")
    - Jeśli usługa nie istnieje w oryginalnym cenniku - NIE DODAWAJ JEJ

    ZASADY OPTYMALIZACJI (SMART GROUPING & BENEFIT LANGUAGE):

    1. ZASADA "MENU RESTAURACJI":
       - Zamiast 10 osobnych pozycji typu "Depilacja Łydek 1 zabieg", "Depilacja Łydek 4 zabiegi", "Depilacja Łydek 6 zabiegów"...
       - STWÓRZ JEDNĄ POZYCJĘ: "Depilacja Laserowa - Łydki (Pakiety)"
       - CENA: "od 200 zł" (najniższa cena pojedynczego zabiegu)
       - OPIS: "Wybierz wariant na miejscu: 1 zabieg: 200zł | Pakiet 4: 700zł (oszczędzasz 100zł) | Pakiet 6: 1000zł."
       - DLACZEGO? Nowy klient nie chce scrollować przez 50 wariantów ilościowych. Chce wiedzieć, że robicie łydki. Stały klient przeczyta opis i zapyta o pakiet.

    2. ZASADA "JĘZYK KORZYŚCI":
       - Zmień nazwę "Radiofrekwencja mikroigłowa" na "Radiofrekwencja Mikroigłowa – Lifting i Redukcja Blizn".
       - Dodaj w opisie, dla kogo to jest (np. "Dla skóry wiotkiej, z bliznami potrądzikowymi").

    3. ZASADA "NIE KASTRUJ":
       - Jeśli usługi są RÓŻNE (np. "Manicure Hybrydowy" vs "Manicure Japoński") -> ZOSTAWIASZ JE OSOBNO. To nie są duplikaty.
       - Łączysz TYLKO warianty ilościowe (1/4/6 zabiegów) lub bardzo bliskie warianty (np. "Masaż 30min", "Masaż 60min" -> "Masaż Relaksacyjny (30-60min)").

    4. FORMATOWANIE:
       - ABSOLUTNY ZAKAZ UŻYWANIA EMOJI - nie używaj żadnych emotikon ani symboli Unicode w nazwach ani opisach.
       - Dodaj TAGI ["Bestseller", "Hit", "Nowość"] przy usługach o wysokim potencjale (np. pakiety startowe, popularne zabiegi na twarz).

    Działaj tak, aby cennik był KRÓTSZY wizualnie, ale BOGATSZY treściowo.
  `;

  const systemInstruction = optimizationMode ? systemInstructionOptimized : systemInstructionOriginal;

  const prompt = `
    ${systemInstruction}
    
    ZADANIE:
    Zwróć dane w formacie NDJSON (Newline Delimited JSON). 
    Każda linia musi być osobnym, poprawnym obiektem JSON.
    Nie otwieraj tablicy []. Nie używaj przecinków na końcu linii.
    
    STRUKTURA WYJŚCIA (kolejność):
    1. Najpierw obiekt metadanych: {"type": "meta", "salonName": "Nazwa Salonu"}
    2. Potem kategoria: {"type": "category", "name": "Nazwa Kategorii"}
    3. Potem usługi należące do tej kategorii: {"type": "service", "name": "Usługa", "price": "100zł", ...}
    4. Potem kolejna kategoria... itd.

    ZASADY TECHNICZNE:
    - Jeśli brak nazwy salonu, pomiń pole salonName.
    - Jeśli brak URL obrazka, pomiń pole imageUrl. Nie wymyślaj linków.
    - Cena: jako tekst (np. "120 zł" lub "od 200 zł").
    - isPromo: true/false.

    DANE WEJŚCIOWE:
    """
    ${rawData}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      throw new Error("Otrzymano pustą odpowiedź od AI.");
    }

    const lines = text.split('\n');
    const result: PricingData = {
      salonName: undefined,
      categories: []
    };

    let currentCategory: Category | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      try {
        const cleanLine = trimmedLine.replace(/^```json/, '').replace(/^```/, '').replace(/,$/, ''); 
        if (!cleanLine) continue;

        const obj = JSON.parse(cleanLine);
        
        if (obj.type === 'meta') {
          if (obj.salonName && obj.salonName !== 'null') result.salonName = obj.salonName;
        }
        else if (obj.type === 'category') {
          currentCategory = {
            categoryName: obj.name || "Inne",
            services: []
          };
          result.categories.push(currentCategory);
        }
        else if (obj.type === 'service') {
          if (!currentCategory) {
            currentCategory = { categoryName: "Usługi", services: [] };
            result.categories.push(currentCategory);
          }

          const serviceItem: ServiceItem = {
            name: obj.name || "Usługa",
            price: obj.price || "-",
            description: obj.description,
            duration: obj.duration,
            isPromo: !!obj.isPromo,
            imageUrl: obj.imageUrl,
            tags: obj.tags
          };
          
          const sanitizedItem = sanitizePricingData(serviceItem);
          currentCategory.services.push(sanitizedItem);
        }

      } catch (e) {
        console.warn("Skipping malformed line:", trimmedLine);
      }
    }

    if (result.categories.length === 0) {
      throw new Error("Nie udało się rozpoznać żadnych kategorii usług.");
    }

    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn("Could not save to cache", e);
    }

    return result;

  } catch (error) {
    console.error("Błąd przetwarzania Gemini:", error);
    throw error;
  }
};

const analyzeLocalDataWithGemini = async (rawData: string): Promise<AuditResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Brak klucza API");

  const ai = new GoogleGenAI({ apiKey });

  // Schema definition for strictly structured output
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER, description: "Score from 0 to 100 based on sales potential" },
      generalFeedback: { type: Type.STRING, description: "Holistic summary of the audit" },
      salesPotential: { type: Type.STRING, description: "Assessment of sales potential (Low/Medium/High) and why" },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            point: { type: Type.STRING },
            consequence: { type: Type.STRING }
          }
        }
      },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
      beforeAfter: {
        type: Type.OBJECT,
        properties: {
          before: { type: Type.STRING, description: "A bad example from the input text" },
          after: { type: Type.STRING, description: "The corrected version of that example" },
          explanation: { type: Type.STRING, description: "Why the change was made" }
        }
      },
      growthTips: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ['SEO', 'Konwersja', 'Retencja', 'Wizerunek'] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            impact: { type: Type.STRING, enum: ['Wysoki', 'Średni', 'Niski'] }
          }
        }
      }
    },
    required: ["overallScore", "generalFeedback", "strengths", "weaknesses", "recommendations", "beforeAfter", "growthTips", "salesPotential"]
  };

  // --- UPDATED AUDIT PROMPT ---
  const prompt = `
    Jesteś DOŚWIADCZONYM AUDYTOREM I STRATEGIEM SALONÓW BEAUTY (specjalizacja: Booksy/Social Media).
    Twoim zadaniem jest analiza cennika pod kątem dwóch typów klientów:
    
    1. "SKANER" (Nowy klient): Szybko przewija ofertę na telefonie. Szuka potwierdzenia jakości, jasnej ceny i odpowiedzi na problem (np. "trądzik"). Gubi się w technicznych nazwach.
    2. "STAŁY BYWALEC" (Klient powracający): Szuka konkretów, nowości i pakietów (oszczędności).
    
    ZADANIE: Przeanalizuj poniższe dane i wygeneruj raport.
    
    CO OCENIASZ SUROWO:
    - Chaos (np. 150 pozycji bez ładu i składu).
    - Duplikaty (np. osobne pozycje dla 1, 4, 6, 8, 10 zabiegów zamiast jednej z wariantami).
    - Brak opisów (Techniczna nazwa "Radiofrekwencja" nic nie mówi laikowi -> powinno być "Lifting bez skalpela").
    - Brak czasu trwania (klient nie wie ile zarezerwować).
    
    W SEKCJI "beforeAfter" (Przed/Po):
    - Znajdź NAJGORSZY przykład (np. sekcję z 10 wariantami tego samego lasera).
    - Pokaż jak to zgrupować w JEDNĄ, czytelną pozycję z opisem wariantów.

    W SEKCJI "growthTips":
    - Daj porady realne dla Booksy (np. "Dodaj do nazwy słowo klucz 'Lifting', bo tego szukają ludzie w wyszukiwarce aplikacji").

    ABSOLUTNY ZAKAZ EMOJI:
    - Nie używaj żadnych emoji ani emotikon w żadnej części odpowiedzi.
    - Dotyczy to nazw usług, opisów, kategorii i wszystkich przykładów.

    ⚠️ BEZWZGLĘDNA ZASADA "SOURCE OF TRUTH":
    - CENNIK KLIENTA JEST JEDYNYM ŹRÓDŁEM PRAWDY
    - W sekcji "beforeAfter" przykłady MUSZĄ pochodzić z oryginalnych danych
    - NIE WYMYŚLAJ usług, które nie istnieją w cenniku klienta
    - Sugestie grupowania mogą tylko REDUKOWAĆ liczbę usług (łączenie wariantów)
    - Jedyny przypadek "zwiększenia" to duplikowanie usługi do różnych kategorii

    DANE WEJŚCIOWE (FRAGMENT):
    ${rawData.substring(0, 30000)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  if (!response.text) throw new Error("Brak odpowiedzi z AI");
  
  const parsedAnalysis = JSON.parse(response.text);

  // PROGRAMMATIC CONVERSION to guarantee 100% of items are preserved.
  // We do NOT ask AI to rewrite the full list because it might truncate it.
  // Instead, we simply format the JSON into a clean, editable text format (TSV).
  const cleanOptimizedText = convertJsonToTsv(rawData);
  
  return {
    ...parsedAnalysis,
    rawCsv: rawData, // Keeps original JSON
    optimizedText: cleanOptimizedText, // Converts to editable list (Name | Price | Desc)
    categories: [], // Legacy compat
    stats: {
      serviceCount: (rawData.match(/"name":/g) || []).length, // Accurate count
      missingDescriptions: 0,
      missingDurations: 0
    }
  };
};

/**
 * Runs the audit process based on the selected integration mode.
 */
const optimizeBooksyContent = async (url: string, mode: IntegrationMode, onProgress?: (msg: string) => void): Promise<AuditResult> => {
  // 1. Check Cache
  const cacheKey = AUDIT_CACHE_PREFIX + mode + '_' + simpleHash(url.trim());
  const cachedAudit = localStorage.getItem(cacheKey);

  if (cachedAudit) {
    console.log("Returning cached AUDIT result");
    if (onProgress) onProgress("Wczytano wynik z pamięci podręcznej.");
    try {
      const parsed = JSON.parse(cachedAudit);
      if (parsed && parsed.overallScore !== undefined) {
        return parsed as AuditResult;
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  // --- NATIVE MOCK MODE (REAL AI on MOCK/INPUT DATA) ---
  if (mode === 'NATIVE') {
    if (onProgress) onProgress("Pobieranie danych (Symulacja Firecrawl)...");
    
    // Use the FULL mock data provided by the user
    const scrapedContent = MOCK_SCRAPED_DATA_FALLBACK; 
    
    await new Promise(r => setTimeout(r, 1000)); // Simulate fetch
    if (onProgress) onProgress("Pobrano dane. Rozpoczynanie analizy AI...");
    
    const result = await analyzeLocalDataWithGemini(scrapedContent);
    
    // Cache and Return
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) { console.warn(e); }

    return result;
  }

  // --- N8N MODE ---
  if (onProgress) onProgress("Wysyłanie zlecenia do n8n...");
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) {
      throw new Error(`Błąd połączenia z n8n: ${response.status} ${response.statusText}`);
    }

    if (onProgress) onProgress("Odbieranie wyników audytu...");
    
    const result = await response.json();

    if (result.success === false) {
       throw new Error("Workflow n8n zwrócił informację o błędzie (success: false).");
    }

    // Process result from n8n. 
    let pricingText = "";
    if (typeof result.pricing === 'string') {
      // If it's a string, we check if it looks like JSON and convert it to TSV for better UX
      if (result.pricing.trim().startsWith('[')) {
         pricingText = convertJsonToTsv(result.pricing);
      } else {
         pricingText = result.pricing;
      }
    } else if (result.pricing) {
      // If it is an object/array, stringify or convert
      pricingText = JSON.stringify(result.pricing, null, 2);
      // Try to convert to TSV if it is an array
      if (Array.isArray(result.pricing)) {
         pricingText = convertJsonToTsv(JSON.stringify(result.pricing));
      }
    }

    const finalResult: AuditResult = {
      overallScore: 85, // Default if n8n doesn't provide
      categories: [],
      stats: {
        serviceCount: pricingText.split('\n').length,
        missingDescriptions: 0, 
        missingDurations: 0
      },
      rawCsv: typeof result.pricing === 'object' ? JSON.stringify(result.pricing, null, 2) : result.pricing, 
      optimizedText: pricingText, // Clean editable text
      generalFeedback: typeof result.audit === 'string' ? result.audit : "Audyt zakończony.",
      
      strengths: ["Cennik pobrany poprawnie."],
      weaknesses: [],
      recommendations: ["Sprawdź opisy i ceny w edytorze."],
      salesPotential: "Wymaga weryfikacji."
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(finalResult));
    } catch (e) {
      console.warn("Could not save audit to cache", e);
    }

    return finalResult;

  } catch (error: any) {
    console.error("n8n Audit Error:", error);
    throw new Error(error.message || "Wystąpił błąd podczas komunikacji z workflow n8n.");
  }
};

// --- PRICELIST OPTIMIZATION ---
// Ta funkcja optymalizuje cennik pod kątem UX/UI/Copywriting/Sprzedaż
// WAŻNE: NIE tworzy nowych usług, NIE usuwa usług - tylko poprawia istniejące

const OPTIMIZATION_CACHE_PREFIX = 'bp_optim_v3_source_truth_';

const optimizePricelist = async (
  pricingData: PricingData,
  onProgress?: (msg: string) => void
): Promise<OptimizationResult> => {
  const inputJson = JSON.stringify(pricingData);
  const cacheKey = OPTIMIZATION_CACHE_PREFIX + simpleHash(inputJson);

  // Check cache
  const cachedResult = localStorage.getItem(cacheKey);
  if (cachedResult) {
    console.log("Returning cached optimization result");
    if (onProgress) onProgress("Wczytano wynik z pamięci podręcznej.");
    try {
      return JSON.parse(cachedResult) as OptimizationResult;
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza API. Upewnij się, że environment variable API_KEY jest ustawiony.");
  }

  const ai = new GoogleGenAI({ apiKey });

  if (onProgress) onProgress("Analizuję cennik...");

  // Schema for structured output
  const optimizationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      optimizedCategories: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            categoryName: { type: Type.STRING },
            services: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  description: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  isPromo: { type: Type.BOOLEAN },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "price", "isPromo"]
              }
            }
          },
          required: ["categoryName", "services"]
        }
      },
      changes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['name_improved', 'description_added', 'description_improved', 'duplicate_merged', 'category_renamed', 'category_reordered', 'service_reordered', 'price_formatted', 'tag_added', 'duration_estimated', 'typo_fixed']
            },
            categoryIndex: { type: Type.INTEGER },
            serviceIndex: { type: Type.INTEGER },
            field: { type: Type.STRING },
            originalValue: { type: Type.STRING },
            newValue: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["type", "field", "originalValue", "newValue", "reason"]
        }
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      qualityScore: { type: Type.INTEGER }
    },
    required: ["optimizedCategories", "changes", "recommendations", "qualityScore"]
  };

  const systemPrompt = `
Jesteś ekspertem UX/UI i copywriterem specjalizującym się w branży beauty/wellness.

TWOJE ZADANIE: Zoptymalizuj cennik pod kątem sprzedaży i doświadczenia klienta.

⚠️ BEZWZGLĘDNA ZASADA "SOURCE OF TRUTH":
- CENNIK KLIENTA JEST JEDYNYM ŹRÓDŁEM PRAWDY
- NIE WYMYŚLAJ NOWYCH USŁUG - możesz tylko pracować z tym, co jest w cenniku
- ZAKAZ tworzenia usług, które nie istnieją w oryginale
- Każda usługa w output MUSI pochodzić z oryginalnego cennika
- Jeśli usługa nie istnieje w input - NIE DODAWAJ JEJ do output

BEZWZGLĘDNE ZASADY (NIENARUSZALNE):
1. LICZBA USŁUG MUSI BYĆ IDENTYCZNA - nie usuwaj ani nie dodawaj usług
2. LICZBA KATEGORII MUSI BYĆ IDENTYCZNA - nie usuwaj ani nie dodawaj kategorii
3. CENY MUSZĄ POZOSTAĆ NIEZMIENIONE (chyba że poprawiasz format, np. "100zł" → "100 zł")
4. NIE TWÓRZ NOWYCH USŁUG Z NICZEGO - to naruszenie zasady SOURCE OF TRUTH
5. NIE ŁĄCZ USŁUG W JEDNĄ (np. 4 warianty = 4 osobne usługi)

CO MOŻESZ ROBIĆ:
1. NAZWY USŁUG - popraw copywriting (ale usługa MUSI istnieć w oryginale):
   - "Masaż 60min" → "Masaż Relaksacyjny (60 min) – Pełne Odprężenie"
   - "Depilacja laserowa nogi" → "Depilacja Laserowa – Nogi (Gładkość na Lata)"
   - ABSOLUTNY ZAKAZ UŻYWANIA EMOJI - nie używaj żadnych emotikon ani symboli Unicode

2. OPISY - dodaj lub popraw:
   - Dodaj opis jeśli brakuje (krótki, sprzedażowy, 1-2 zdania)
   - Popraw istniejący opis (język korzyści, dla kogo, efekty)
   - ABSOLUTNY ZAKAZ EMOJI w opisach

3. NAZWY KATEGORII - popraw:
   - "Usługi" → "Zabiegi na Twarz"
   - "Inne" → "Masaże i Relaks"
   - ABSOLUTNY ZAKAZ EMOJI w nazwach kategorii

4. KOLEJNOŚĆ - zoptymalizuj:
   - Kategorie od najpopularniejszych (twarzy, włosy) do niszowych
   - Usługi w kategorii od bestsellera do specjalistycznych

5. TAGI - dodaj gdzie uzasadnione:
   - "Bestseller" - popularne zabiegi
   - "Nowość" - nowe usługi
   - "Premium" - drogie zabiegi

6. LITERÓWKI - popraw

7. WYKRYWANIE DUPLIKATÓW:
   - Jeśli widzisz duplikaty (identyczne nazwy), oznacz to w "changes" z typem "duplicate_merged"
   - ALE NIE USUWAJ DUPLIKATÓW - zostaw je, tylko zgłoś

FORMATOWANIE ODPOWIEDZI:
- Zwróć DOKŁADNIE tyle kategorii ile w input
- Zwróć DOKŁADNIE tyle usług w każdej kategorii ile w input
- Każda zmiana musi być udokumentowana w tablicy "changes"
- qualityScore: 0-100 (jakość cennika po optymalizacji)
`;

  const prompt = `
${systemPrompt}

CENNIK DO OPTYMALIZACJI:
${inputJson}

WAŻNE: Wejście ma ${pricingData.categories.length} kategorii i łącznie ${pricingData.categories.reduce((acc, cat) => acc + cat.services.length, 0)} usług.
Twój output MUSI mieć DOKŁADNIE tyle samo kategorii i usług!
`;

  if (onProgress) onProgress("Optymalizuję nazwy i opisy...");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: optimizationSchema
      }
    });

    if (!response.text) {
      throw new Error("Otrzymano pustą odpowiedź od AI.");
    }

    const parsed = JSON.parse(response.text);

    if (onProgress) onProgress("Weryfikuję wyniki...");

    // Validate that we have the same number of categories and services
    const inputServiceCount = pricingData.categories.reduce((acc, cat) => acc + cat.services.length, 0);
    const outputServiceCount = parsed.optimizedCategories.reduce((acc: number, cat: any) => acc + cat.services.length, 0);

    if (parsed.optimizedCategories.length !== pricingData.categories.length) {
      console.warn(`Category count mismatch: input=${pricingData.categories.length}, output=${parsed.optimizedCategories.length}`);
      // Fallback: use original structure with AI suggestions applied manually
    }

    if (outputServiceCount !== inputServiceCount) {
      console.warn(`Service count mismatch: input=${inputServiceCount}, output=${outputServiceCount}`);
      // This is a critical error - AI violated the rules
    }

    // Build the result
    const optimizedPricingData: PricingData = {
      salonName: pricingData.salonName,
      categories: parsed.optimizedCategories.map((cat: any) => ({
        categoryName: cat.categoryName,
        services: cat.services.map((svc: any) => ({
          name: svc.name,
          price: svc.price,
          description: svc.description || undefined,
          duration: svc.duration || undefined,
          isPromo: svc.isPromo || false,
          tags: svc.tags || undefined
        }))
      }))
    };

    // Calculate summary
    const changes: OptimizationChange[] = parsed.changes || [];
    const summary = {
      totalChanges: changes.length,
      duplicatesFound: changes.filter((c: OptimizationChange) => c.type === 'duplicate_merged').length,
      descriptionsAdded: changes.filter((c: OptimizationChange) => c.type === 'description_added').length,
      namesImproved: changes.filter((c: OptimizationChange) => c.type === 'name_improved').length,
      categoriesOptimized: changes.filter((c: OptimizationChange) =>
        c.type === 'category_renamed' || c.type === 'category_reordered'
      ).length
    };

    const result: OptimizationResult = {
      optimizedPricingData,
      changes,
      summary,
      recommendations: parsed.recommendations || [],
      qualityScore: parsed.qualityScore || 75
    };

    // Cache result
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn("Could not save optimization to cache", e);
    }

    if (onProgress) onProgress("Optymalizacja zakończona!");

    return result;

  } catch (error) {
    console.error("Optimization error:", error);
    throw new Error("Błąd podczas optymalizacji cennika. Spróbuj ponownie.");
  }
};

// --- CATEGORY SUGGESTIONS ---
// Funkcja analizuje usługi i sugeruje możliwe kategorie do wykorzystania

const SUGGESTIONS_CACHE_PREFIX = 'bp_cat_suggest_v2_no_emoji_';

const suggestCategories = async (
  pricingData: PricingData,
  onProgress?: (msg: string) => void
): Promise<CategorySuggestionsResult> => {
  const inputJson = JSON.stringify(pricingData);
  const cacheKey = SUGGESTIONS_CACHE_PREFIX + simpleHash(inputJson);

  // Check cache
  const cachedResult = localStorage.getItem(cacheKey);
  if (cachedResult) {
    console.log("Returning cached category suggestions");
    if (onProgress) onProgress("Wczytano sugestie z pamięci podręcznej.");
    try {
      return JSON.parse(cachedResult) as CategorySuggestionsResult;
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza API. Upewnij się, że environment variable API_KEY jest ustawiony.");
  }

  const ai = new GoogleGenAI({ apiKey });

  if (onProgress) onProgress("Analizuję usługi...");

  // Schema for structured output
  const suggestionsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nazwa kategorii BEZ emoji (np. 'Zabiegi na Twarz', 'Depilacja Laserowa')" },
            description: { type: Type.STRING, description: "Krótki opis dlaczego ta kategoria ma sens" },
            matchingServices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista nazw usług które pasują do tej kategorii"
            },
            priority: {
              type: Type.STRING,
              enum: ['high', 'medium', 'low'],
              description: "Priorytet: high (>10 usług), medium (5-10), low (<5)"
            }
          },
          required: ["name", "description", "matchingServices", "priority"]
        }
      },
      analysisNotes: {
        type: Type.STRING,
        description: "Ogólne uwagi o strukturze cennika"
      },
      currentIssues: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Lista problemów z obecną strukturą kategorii"
      }
    },
    required: ["suggestions", "analysisNotes", "currentIssues"]
  };

  const systemPrompt = `
Jesteś ekspertem UX w branży beauty/wellness. Analizujesz cenniki salonów i sugerujesz optymalne kategorie.

TWOJE ZADANIE: Przeanalizuj wszystkie usługi i zasugeruj MOŻLIWE KATEGORIE które użytkownik może wykorzystać do reorganizacji cennika.

ZASADY ANALIZY:
1. Przejrzyj WSZYSTKIE usługi w cenniku
2. Zidentyfikuj naturalne grupy usług (np. wszystkie depilacje, wszystkie masaże, zabiegi na twarz)
3. Zaproponuj nazwy kategorii BEZ EMOJI - czyste, profesjonalne nazwy (np. "Depilacja Laserowa", "Zabiegi na Twarz")
4. Dla każdej sugestii wypisz konkretne usługi które do niej pasują

TYPY KATEGORII DO ROZWAŻENIA:
- Według części ciała (Twarz, Ciało, Dłonie/Stopy)
- Według technologii (Laser, Peeling, Mezoterapia)
- Według celu (Odmładzanie, Odchudzanie, Relaks)
- Według grupy docelowej (Dla Kobiet, Dla Mężczyzn, Pakiety)
- Specjalne (Promocje, Bestsellery, Nowości)

UWAGI:
- Możesz proponować kategorie nawet z 1 usługą jeśli to sensowna nisza
- Wskaż problemy z obecną strukturą (np. "Kategoria 'Usługi' jest zbyt ogólna")
- Bądź konkretny - używaj polskich nazw
- NIE UŻYWAJ EMOJI W NAZWACH KATEGORII
- Priority: high = >10 usług, medium = 5-10 usług, low = <5 usług

WAŻNE: Sugestie mają POMÓC użytkownikowi zrozumieć jakie kategorie warto stworzyć.
Nie narzucaj jednego rozwiązania - pokaż możliwości.
`;

  const prompt = `
${systemPrompt}

OBECNA STRUKTURA CENNIKA:
${inputJson}

Obecne kategorie: ${pricingData.categories.map(c => c.categoryName).join(', ')}
Łączna liczba usług: ${pricingData.categories.reduce((acc, cat) => acc + cat.services.length, 0)}
`;

  if (onProgress) onProgress("Generuję sugestie kategorii...");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionsSchema
      }
    });

    if (!response.text) {
      throw new Error("Otrzymano pustą odpowiedź od AI.");
    }

    const parsed = JSON.parse(response.text);

    if (onProgress) onProgress("Gotowe!");

    const result: CategorySuggestionsResult = {
      suggestions: parsed.suggestions || [],
      analysisNotes: parsed.analysisNotes || "",
      currentIssues: parsed.currentIssues || []
    };

    // Cache result
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn("Could not save suggestions to cache", e);
    }

    return result;

  } catch (error) {
    console.error("Category suggestions error:", error);
    throw new Error("Błąd podczas analizy kategorii. Spróbuj ponownie.");
  }
};

export { parsePricingData, optimizeBooksyContent, optimizePricelist, suggestCategories };
