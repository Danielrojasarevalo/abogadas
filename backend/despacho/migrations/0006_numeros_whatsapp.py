"""Pone el WhatsApp de cada abogada (solo si todavía no tiene uno)."""

from django.db import migrations

# Usuario -> número de WhatsApp
NUMEROS = {
    "eli": "+57 320 7285053",  # Elizabeth Imbachi
    "kathe": "+57 313 3957573",  # Katherine Rojas
}


def poner_numeros(apps, schema_editor):
    PerfilAbogada = apps.get_model("despacho", "PerfilAbogada")
    for usuario, numero in NUMEROS.items():
        PerfilAbogada.objects.filter(usuario__username=usuario, whatsapp="").update(whatsapp=numero)


class Migration(migrations.Migration):
    dependencies = [
        ("despacho", "0005_documentos_whatsapp"),
    ]

    operations = [
        migrations.RunPython(poner_numeros, migrations.RunPython.noop),
    ]
