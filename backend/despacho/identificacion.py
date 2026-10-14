"""
Validación de documentos de identidad colombianos.

Acepta el número como lo escribe la gente (con puntos, espacios o comas: 1.075.123.456)
y lo devuelve limpio. Cada tipo tiene su formato:

- CC  Cédula de ciudadanía: solo números, 4 a 10 dígitos.
- TI  Tarjeta de identidad: solo números, 10 u 11 dígitos.
- CE  Cédula de extranjería: letras y números, 3 a 15.
- PAS Pasaporte: letras y números, 5 a 15.
- PPT Permiso por Protección Temporal: solo números, 5 a 12 dígitos.
- PEP Permiso Especial de Permanencia: solo números, 6 a 15 dígitos.
- NIT Empresas: 8 a 10 dígitos y, si se escribe, el dígito de verificación (900123456-7)
      se comprueba con el cálculo de la DIAN.
"""

import re

# tipo: (expresión regular, mensaje de error)
FORMATOS = {
    "CC": (r"\d{4,10}", "La cédula de ciudadanía debe tener solo números (de 4 a 10)."),
    "TI": (r"\d{10,11}", "La tarjeta de identidad debe tener 10 u 11 números."),
    "CE": (r"[A-Z0-9]{3,15}", "La cédula de extranjería debe tener de 3 a 15 letras o números."),
    "PAS": (r"[A-Z0-9]{5,15}", "El pasaporte debe tener de 5 a 15 letras o números."),
    "PPT": (r"\d{5,12}", "El PPT debe tener solo números (de 5 a 12)."),
    "PEP": (r"\d{6,15}", "El PEP debe tener solo números (de 6 a 15)."),
    "NIT": (r"\d{8,10}(-\d)?", "El NIT debe tener de 8 a 10 números y, si quieres, el dígito de verificación (ej: 900123456-7)."),
}

# Pesos del dígito de verificación del NIT (DIAN), del último dígito hacia atrás
PESOS_NIT = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]


def digito_verificacion(nit):
    suma = sum(int(d) * p for d, p in zip(reversed(nit), PESOS_NIT))
    resto = suma % 11
    return resto if resto in (0, 1) else 11 - resto


def limpiar_documento(tipo, numero):
    """
    Devuelve (numero_limpio, error). Si el número es válido, error es None.
    """
    numero = re.sub(r"[\s.,]", "", str(numero or "")).upper()
    if not numero:
        return "", "Escribe tu número de documento."
    formato = FORMATOS.get(tipo)
    if formato is None:
        return numero, "Tipo de documento no válido."
    patron, mensaje = formato
    if not re.fullmatch(patron, numero):
        return numero, mensaje
    if tipo == "NIT" and "-" in numero:
        base, dv = numero.split("-")
        if digito_verificacion(base) != int(dv):
            return numero, "El dígito de verificación del NIT no coincide. Revisa el número."
    return numero, None
