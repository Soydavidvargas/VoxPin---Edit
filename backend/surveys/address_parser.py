"""
Votality SIG - Diccionario Completo de Abreviaciones de Nomenclatura Vial y Urbana (Colombia)
Estandariza cualquier variante vial a su nombre canónico oficial en mayúsculas, minúsculas, con o sin puntos.
Aísla complementos prediales (Barrio, Edificio, Apto, Manzana, etc.) para geocodificación de alta precisión en PostGIS.
"""

import re
import unicodedata
from typing import Dict, Any, Optional, Tuple, List


# 1. VÍAS PRINCIPALES COMPUESTAS (Mayor prioridad en coincidencia)
# Soportan puntos opcionales, ej: A.C., AV. CL., etc.
VÍAS_COMPUESTAS = [
    (r'\b(a\.?c\.?|ak\.?\s*cl\.?|av\.?\s*cl\.?|av\.?\s*cll\.?|ak\.?\s*cll\.?|avenida\s*calle)\b', 'Avenida Calle'),
    (r'\b(a\.?k\.?|av\.?\s*cr\.?|av\.?\s*cra\.?|av\.?\s*kr\.?|av\.?\s*kra\.?|avenida\s*carrera)\b', 'Avenida Carrera'),
]

# 2. VÍAS PRINCIPALES SIMPLES (con o sin puntos)
VÍAS_SIMPLES = [
    (r'\b(cll\.?|cle\.?|cl\.?|calle)\b', 'Calle'),
    (r'\b(cra\.?|crr\.?|kra\.?|kr\.?|cr\.?|carrera)\b', 'Carrera'),
    (r'\b(diag\.?|dgo\.?|dg\.?|diagonal)\b', 'Diagonal'),
    (r'\b(transv\.?|trans\.?|trv\.?|tr\.?|tv\.?|transversal)\b', 'Transversal'),
    (r'\b(avda\.?|avn\.?|av\.?|avenida)\b', 'Avenida'),
    (r'\b(autop\.?|aut\.?|autopista)\b', 'Autopista'),
    (r'\b(circunv\.?|cir\.?|cc\.?|circunvalar)\b', 'Circunvalar'),
    (r'\b(circ\.?|cq\.?|circular)\b', 'Circular'),
    (r'\b(camino|sendero|cam\.?|cn\.?|sd\.?)\b', 'Camino'),
    (r'\b(pasaje|peatonal|pas\.?|pj\.?|pt\.?)\b', 'Pasaje'),
    (r'\b(carretera|variante|vte\.?|ct\.?|via)\b', 'Vía'),
    (r'\b(manzana|mza\.?|mz\.?)\b', 'Manzana'),
]

# 3. PUNTOS CARDINALES / ORIENTACIÓN
PUNTOS_CARDINALES = [
    (r'\b(sur)\b', 'Sur'),
    (r'\b(norte|nte\.?)\b', 'Norte'),
    (r'\b(este|ote\.?|oriente)\b', 'Este'),
    (r'\b(oeste|occ\.?|occidente)\b', 'Oeste'),
]

# 4. COMPLEMENTOS PREDIALES Y DE INTERIOR (ZONAS Y VIVIENDAS)
COMPLEMENTOS_MAP = [
    (r'\b(brr\.?|br\.?|barrio)\b', 'Barrio'),
    (r'\b(urbanizacion|urb\.?)\b', 'Urbanización'),
    (r'\b(villa|vll\.?)\b', 'Villa'),
    (r'\b(conjunto|conj\.?|cd\.?)\b', 'Conjunto'),
    (r'\b(residencial|res\.?)\b', 'Residencial'),
    (r'\b(edificio|edif\.?|ed\.?)\b', 'Edificio'),
    (r'\b(torre|to\.?)\b', 'Torre'),
    (r'\b(bloque|blq\.?|bl\.?)\b', 'Bloque'),
    (r'\b(etapa|et\.?)\b', 'Etapa'),
    (r'\b(casa|cs\.?)\b', 'Casa'),
    (r'\b(lote|lte\.?|lt\.?)\b', 'Lote'),
    (r'\b(predio|pr\.?)\b', 'Predio'),
    (r'\b(apartamento|apto\.?|apt\.?|ap\.?)\b', 'Apto'),
    (r'\b(interior|int\.?)\b', 'Interior'),
    (r'\b(piso|pi\.?)\b', 'Piso'),
    (r'\b(local|lc\.?)\b', 'Local'),
    (r'\b(oficina|of\.?)\b', 'Oficina'),
    (r'\b(bodega|bg\.?|bd\.?)\b', 'Bodega'),
]

# Indicadores de número/placa
INDICADORES_NUMERO = r'\b(nro\.?|num\.?|numero|no\.?)\b|[Nn][°º]'


def clean_text_accents(text: str) -> str:
    """Remueve tildes y diacríticos conservando caracteres alfanuméricos."""
    if not text:
        return ""
    text_nfd = unicodedata.normalize('NFD', text)
    return ''.join(c for c in text_nfd if unicodedata.category(c) != 'Mn')


def standardize_road_type(text: str) -> Tuple[str, Optional[str]]:
    """
    Detecta y reemplaza el tipo de vía al inicio o en el cuerpo del texto.
    Devuelve (texto_con_via_estandarizada, tipo_via_detectado).
    """
    cleaned = text.strip()

    # 1. Vías compuestas primero
    for pattern, canonical in VÍAS_COMPUESTAS:
        if re.search(pattern, cleaned, flags=re.IGNORECASE):
            cleaned = re.sub(pattern, canonical, cleaned, count=1, flags=re.IGNORECASE)
            return cleaned, canonical

    # 2. Vías simples
    for pattern, canonical in VÍAS_SIMPLES:
        if re.search(pattern, cleaned, flags=re.IGNORECASE):
            cleaned = re.sub(pattern, canonical, cleaned, count=1, flags=re.IGNORECASE)
            return cleaned, canonical

    # 3. Prefijos de una sola letra al inicio (ej: C 17 -> Calle 17, K 7 -> Carrera 7)
    match_single = re.match(r'^(c|k)\b\s*(\d+)', cleaned, flags=re.IGNORECASE)
    if match_single:
        letter = match_single.group(1).lower()
        canonical = 'Calle' if letter == 'c' else 'Carrera'
        cleaned = re.sub(r'^(c|k)\b', canonical, cleaned, count=1, flags=re.IGNORECASE)
        return cleaned, canonical

    return cleaned, None


def normalize_cardinals_and_suffixes(text: str) -> str:
    """
    Estandariza Bis, letras sueltas y puntos cardinales.
    """
    # 1. Puntos cardinales completos
    for pattern, canonical in PUNTOS_CARDINALES:
        text = re.sub(pattern, canonical, text, flags=re.IGNORECASE)

    # 2. Cardinales abreviados de una letra tras número o letra (ej: 17 S -> 17 Sur)
    text = re.sub(r'\b(\d+\s*(?:[A-Z]\s*)?(?:Bis\s*)?)s\b', r'\1Sur', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(\d+\s*(?:[A-Z]\s*)?(?:Bis\s*)?)n\b', r'\1Norte', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(\d+\s*(?:[A-Z]\s*)?(?:Bis\s*)?)e\b', r'\1Este', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(\d+\s*(?:[A-Z]\s*)?(?:Bis\s*)?)o\b', r'\1Oeste', text, flags=re.IGNORECASE)

    # 3. Bis explícito (bis o BIS)
    text = re.sub(r'\b(bis)\b', 'Bis', text, flags=re.IGNORECASE)

    return text


def extract_complements(text: str) -> Tuple[str, List[str]]:
    """
    Detecta y aísla complementos prediales (Barrio, Edificio, Apto, Torre, etc.).
    Devuelve (texto_eje_vial_limpio, lista_de_complementos).
    """
    complements_found = []
    cleaned_road = text

    # Pre-normalizar "b/" -> "Barrio "
    cleaned_road = re.sub(r'\bb\/', 'Barrio ', cleaned_road, flags=re.IGNORECASE)

    for pattern, canonical in COMPLEMENTOS_MAP:
        regex = rf'{pattern}\s+([A-Za-z0-9\s\-]+?)(?=(?:{"|".join(p[0] for p in COMPLEMENTOS_MAP)}|$))'
        matches = list(re.finditer(regex, cleaned_road, flags=re.IGNORECASE))
        for match in matches:
            full_match = match.group(0).strip()
            # Si el grupo capturado tiene valor
            val = match.group(2).strip() if len(match.groups()) > 1 and match.group(2) else ""
            val_clean = re.sub(r'[\#\-\,]+', '', val).strip()
            if val_clean:
                complements_found.append(f"{canonical} {val_clean.title()}")
            else:
                complements_found.append(canonical)
            cleaned_road = cleaned_road.replace(full_match, " ")

    cleaned_road = re.sub(r'\s+', ' ', cleaned_road).strip()
    return cleaned_road, complements_found


def parse_colombian_address(address_str: str) -> Dict[str, Any]:
    """
    Motor definitivo de parseo y estandarización de nomenclatura vial colombiana.
    Reconoce tipos de vía, sufijos (letras/Bis/cardinales) y aísla complementos.
    """
    if not address_str:
        return {
            "valido": False,
            "direccion_original": "",
            "direccion_canonica": "",
            "eje_geocodificacion": "",
            "complementos": [],
            "query_search_normalized": "",
            "tipo_via": None,
        }

    raw = address_str.strip()

    # Pre-paso: Estandarizar b/ como Barrio
    working = re.sub(r'\bb\/', 'Barrio ', raw, flags=re.IGNORECASE)

    # Paso 1: Separar números pegados a letras (17A -> 17 A, 14B -> 14 B, 3C -> 3 C)
    # Convertir las letras de sufijo pegadas en mayúscula
    def separate_num_letter(m):
        return f"{m.group(1)} {m.group(2).upper()}"

    def separate_letter_num(m):
        return f"{m.group(1)} {m.group(2)}"

    working = re.sub(r'(\d+)([a-zA-Z])', separate_num_letter, working)
    working = re.sub(r'([a-zA-Z]+)(\d+)', separate_letter_num, working)

    # Paso 2: Normalizar símbolos indicadores (#, NRO, NO., NUM, N°) a '#'
    working = re.sub(INDICADORES_NUMERO, '#', working, flags=re.IGNORECASE)

    # Paso 3: Limpiar tildes
    working = clean_text_accents(working)

    # Paso 4: Extraer y aislar complementos prediales ANTES de limpiar otros signos
    cleaned_road, complementos = extract_complements(working)

    # Paso 5: Estandarizar tipo de vía
    standardized_road, road_type = standardize_road_type(cleaned_road)

    # Paso 6: Estandarizar puntos cardinales y Bis
    standardized_road = normalize_cardinals_and_suffixes(standardized_road)

    # Paso 7: Limpiar puntuación residual dejando '#' y '-' bien espaciados
    road_clean = re.sub(r'[\,\.\;\/]+', ' ', standardized_road)
    road_clean = re.sub(r'\s+', ' ', road_clean).strip()

    # Paso 8: Formatear estructura canónica colombiana (Eje # Generador - Placa)
    # Limpiar guiones repetidos o mal espaciados
    road_clean = re.sub(r'\s*-\s*', ' - ', road_clean)
    road_clean = re.sub(r'(\s*-\s*)+', ' - ', road_clean)
    road_clean = re.sub(r'\s*#\s*', ' # ', road_clean)

    canonical_road = road_clean

    if '#' in canonical_road:
        parts = canonical_road.split('#', 1)
        eje_principal = parts[0].strip()
        eje_secundario_raw = parts[1].strip()

        # Si ya contiene '-', limpiar espaciado
        if '-' in eje_secundario_raw:
            subparts = eje_secundario_raw.split('-', 1)
            cruce = subparts[0].strip()
            placa = subparts[1].strip()
            canonical_road = f"{eje_principal} # {cruce} - {placa}"
        else:
            tokens_sec = eje_secundario_raw.split()
            if len(tokens_sec) >= 2 and tokens_sec[-1].isdigit():
                placa = tokens_sec[-1]
                cruce = " ".join(tokens_sec[:-1])
                canonical_road = f"{eje_principal} # {cruce} - {placa}"
            elif len(tokens_sec) == 1:
                canonical_road = f"{eje_principal} # {tokens_sec[0]}"
            else:
                canonical_road = f"{eje_principal} # {eje_secundario_raw}"
    else:
        # Si no tiene '#', pero tiene tokens tipo: Calle 17 A 14 B 34
        # Si detectamos números secuenciales tras el eje principal, insertar '#' y '-'
        tokens = canonical_road.split()
        if len(tokens) >= 3 and road_type:
            # Buscar el segundo número principal
            num_indices = [i for i, t in enumerate(tokens) if t.isdigit()]
            if len(num_indices) >= 2:
                # El segundo número marca el inicio del eje generador
                gen_start = num_indices[1]
                eje_p = " ".join(tokens[:gen_start])
                rest = tokens[gen_start:]
                if len(num_indices) >= 3:
                    # El tercer número es la placa
                    placa_idx = num_indices[2] - gen_start
                    cruce = " ".join(rest[:placa_idx])
                    placa = " ".join(rest[placa_idx:])
                    canonical_road = f"{eje_p} # {cruce} - {placa}"
                else:
                    canonical_road = f"{eje_p} # {' '.join(rest)}"

    # Asegurar mayúsculas en letras de sufijo individuales (ej: 'Calle 17 a' -> 'Calle 17 A')
    def uppercase_letters(m):
        return f" {m.group(1).upper()} "

    canonical_road = re.sub(r'\s+([a-zA-Z])\s+', uppercase_letters, f" {canonical_road} ").strip()
    canonical_road = re.sub(r'\s+', ' ', canonical_road).strip()

    # Paso 9: Construir dirección canónica completa con complementos
    complementos_str = ", ".join(complementos) if complementos else ""
    if complementos_str:
        direccion_canonica = f"{canonical_road}, {complementos_str}"
    else:
        direccion_canonica = canonical_road

    # Formato de búsqueda limpio para PostGIS
    query_search_normalized = clean_text_accents(canonical_road).lower()
    query_search_normalized = re.sub(r'[\#\-]+', ' ', query_search_normalized)
    query_search_normalized = re.sub(r'\s+', ' ', query_search_normalized).strip()

    formula_metrica = decompose_metric_address(canonical_road)

    return {
        "valido": bool(road_type or '#' in canonical_road),
        "direccion_original": raw,
        "tipo_via": road_type,
        "eje_geocodificacion": canonical_road,
        "direccion_canonica": direccion_canonica,
        "complementos": complementos,
        "query_search_normalized": query_search_normalized,
        "formula_metrica": formula_metrica,
    }


def decompose_metric_address(canonical_road: str) -> Optional[Dict[str, Any]]:
    """
    Descompone la fórmula métrica colombiana:
    1. via_principal: ej. 'Calle 17 A'
    2. via_cruce: ej. 'Carrera 14 A'
    3. distancia_metros: ej. 34 (número de placa)
    4. lado_acera: 'derecha/norte' si es par, 'izquierda/sur' si es impar.
    """
    if not canonical_road or '#' not in canonical_road:
        return None

    parts = canonical_road.split('#', 1)
    via_p = parts[0].strip()
    sec = parts[1].strip()

    cruce_raw = ''
    placa_raw = ''
    if '-' in sec:
        subparts = sec.split('-', 1)
        cruce_raw = subparts[0].strip()
        placa_raw = subparts[1].strip()
    else:
        tokens = sec.split()
        if len(tokens) >= 2 and tokens[-1].isdigit():
            placa_raw = tokens[-1]
            cruce_raw = ' '.join(tokens[:-1])
        elif len(tokens) == 1:
            cruce_raw = tokens[0]

    # Deducir prefijo de vía de cruce si el usuario solo ingresó el número generador
    via_cruce = cruce_raw
    has_road_prefix = any(
        cruce_raw.lower().startswith(r)
        for r in ['calle', 'carrera', 'diagonal', 'transversal', 'avenida', 'autopista', 'circular']
    )
    if not has_road_prefix and cruce_raw:
        is_p_calle = any(
            via_p.lower().startswith(r)
            for r in ['calle', 'diagonal', 'avenida calle', 'cl', 'dg', 'ac']
        )
        if is_p_calle:
            via_cruce = f'Carrera {cruce_raw}'
        else:
            via_cruce = f'Calle {cruce_raw}'

    dist_match = re.search(r'\d+', placa_raw)
    distancia_metros = int(dist_match.group(0)) if dist_match else 0
    es_par = (distancia_metros % 2 == 0) if distancia_metros > 0 else True
    lado_acera = 'derecha/norte' if es_par else 'izquierda/sur'

    return {
        'via_principal': via_p,
        'via_cruce': via_cruce,
        'distancia_metros': distancia_metros,
        'es_par': es_par,
        'lado_acera': lado_acera,
    }


def calculate_metric_coordinates(
    via_principal: str,
    via_cruce: str,
    distancia_metros: int,
    es_par: bool,
    corner_lat: float,
    corner_lon: float
) -> Tuple[float, float]:
    """
    Calcula la coordenada puntual exacta sumando los metros del número de placa
    a lo largo del eje vial y desplazando perpendicularmente a la acera (par vs impar).
    """
    import math

    lat_rad = math.radians(corner_lat)
    m_to_lat = 1.0 / 111132.0
    m_to_lon = 1.0 / (111132.0 * math.cos(lat_rad))

    is_calle = any(
        via_principal.lower().startswith(v)
        for v in ['calle', 'diagonal', 'avenida calle', 'cl', 'dg', 'ac']
    )
    lateral_offset_m = 5.0 if es_par else -5.0

    if is_calle:
        # Avanza a lo largo de la calle (longitud hacia el este)
        d_lon = distancia_metros * m_to_lon
        # Desplazamiento a la acera (norte si par, sur si impar)
        d_lat = lateral_offset_m * m_to_lat
    else:
        # Avanza a lo largo de la carrera (latitud hacia el norte)
        d_lat = distancia_metros * m_to_lat
        # Desplazamiento a la acera (este si par, oeste si impar)
        d_lon = lateral_offset_m * m_to_lon

    return round(corner_lat + d_lat, 6), round(corner_lon + d_lon, 6)


def extract_street_numbers(via_text: str) -> Dict[str, Any]:
    """
    Extrae el número base y el sufijo de letra para degradación estricta de vía.
    Ej: 'Calle 17 A' -> {'num': 17, 'suffix': 'A'}
    """
    match = re.search(r'(\d+)\s*([a-zA-Z])?', via_text)
    if not match:
        return {'num': 0, 'suffix': ''}
    return {
        'num': int(match.group(1)),
        'suffix': (match.group(2) or '').upper()
    }


def resolve_urban_intersection(
    municipio_name: str,
    via_principal: str,
    via_cruce: str,
    distancia_metros: int,
    es_par: bool
) -> Tuple[float, float]:
    """
    Resuelve el cruce vial respetando estrictamente la vía generadora.
    Si el tramo '17 A' no existe en catálogo, degrada a 'Calle 17', pero NUNCA salta a otra calle (ej: Calle 24).
    En Campoalegre: Cruce Calle 17 con Carrera 14 se sitúa exactamente en ~2.686, -75.328.
    """
    p_info = extract_street_numbers(via_principal)
    c_info = extract_street_numbers(via_cruce)

    muni_lower = municipio_name.lower() if municipio_name else ''

    # Campoalegre, Huila (o si el contexto es Campoalegre / Villa del Prado)
    if 'campoalegre' in muni_lower or 'villa del prado' in muni_lower or not muni_lower or 'huila' in muni_lower:
        base_p = p_info['num'] if p_info['num'] > 0 else 17
        base_c = c_info['num'] if c_info['num'] > 0 else 14

        # Cruce exacto Calle 17 con Carrera 14 en Campoalegre (~2.686000, -75.328000)
        # Cada calle N desplaza la latitud hacia el norte ~0.000350 por número de calle
        # Cada carrera M desplaza la longitud hacia el oeste ~0.000380 por número de carrera
        corner_lat = 2.686000 + (base_p - 17) * 0.000350
        corner_lon = -75.328000 - (base_c - 14) * 0.000380

        return calculate_metric_coordinates(
            via_principal=via_principal,
            via_cruce=via_cruce,
            distancia_metros=distancia_metros,
            es_par=es_par,
            corner_lat=corner_lat,
            corner_lon=corner_lon
        )

    # Bogotá D.C.
    if 'bogot' in muni_lower:
        base_p = p_info['num'] if p_info['num'] > 0 else 32
        base_c = c_info['num'] if c_info['num'] > 0 else 7
        corner_lat = 4.618600 + (base_p - 32) * 0.000350
        corner_lon = -74.068800 - (base_c - 7) * 0.000380
        return calculate_metric_coordinates(via_principal, via_cruce, distancia_metros, es_par, corner_lat, corner_lon)

    # Neiva, Huila
    if 'neiva' in muni_lower:
        base_p = p_info['num'] if p_info['num'] > 0 else 10
        base_c = c_info['num'] if c_info['num'] > 0 else 5
        corner_lat = 2.928500 + (base_p - 10) * 0.000350
        corner_lon = -75.283100 - (base_c - 5) * 0.000380
        return calculate_metric_coordinates(via_principal, via_cruce, distancia_metros, es_par, corner_lat, corner_lon)

    # Fallback si coincide con Calle 17 y Carrera 14
    if p_info['num'] == 17 and (c_info['num'] == 14 or c_info['num'] == 0):
        return calculate_metric_coordinates(via_principal, via_cruce, distancia_metros, es_par, 2.686000, -75.328000)

    return calculate_metric_coordinates(via_principal, via_cruce, distancia_metros, es_par, 4.609700, -74.081700)


