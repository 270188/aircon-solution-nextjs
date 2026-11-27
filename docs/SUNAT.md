# Facturación electrónica directa con SUNAT

El backend emite facturas y boletas por el **SEE - Del contribuyente**: arma el XML UBL 2.1, lo firma con el
certificado digital de AIRCONSOLUTION SERVICES SAC y lo envía al servicio web de SUNAT. No hay proveedor
intermedio ni costo por comprobante.

## Qué hace el sistema

| Acción en el panel | Qué se envía a SUNAT |
|---|---|
| Emitir factura (F001) o boleta (B001) | XML firmado, uno por uno (`sendBill`). SUNAT responde al instante con la constancia (CDR). |
| Anular una factura aceptada | Comunicación de baja (`RA-AAAAMMDD-n`) |
| Anular una boleta aceptada | Resumen diario con estado 3 (`RC-AAAAMMDD-n`) |
| Consultar anulación | Si SUNAT dejó la baja "en proceso", el botón **Consultar anulación** pregunta por el ticket. |

El XML firmado y el CDR se guardan en la base de datos y se descargan desde el comprobante (botones **XML**
y **CDR**). SUNAT exige conservarlos. La representación impresa muestra el código hash (valor resumen).

## Pasos en SUNAT (solo los puede hacer la empresa)

1. **Certificado digital.** Entra a SUNAT Operaciones en Línea con la clave SOL del RUC 20616633733 →
   *Empresas* → *Comprobantes de pago* → *Certificado Digital Tributario* y solicita el certificado gratuito.
   Descarga el archivo `.pfx` y anota su contraseña. Si ya tienes un certificado de otra entidad, también sirve.
2. **Registrar el certificado** para el SEE - Del contribuyente, en SOL → *Comprobantes de pago* →
   *SEE - Del contribuyente* → *Certificado digital* (si usas el certificado gratuito de SUNAT, revisa que figure
   como registrado).
3. **Usuario SOL secundario.** En SOL → *Administración de usuarios secundarios*, crea un usuario solo para el
   sistema (por ejemplo `FACTURA1`) y dale el perfil de emisión electrónica desde los sistemas del contribuyente.
   No uses el usuario principal.
4. **Series.** E001 es la serie del portal de SUNAT (SEE-SOL). El sistema usa **F001** (facturas) y **B001**
   (boletas), que son series distintas. Si ya emitiste F001/B001 en otro sistema, indica el siguiente número en
   `INVOICE_FIRST_NUMBER_FACTURA` / `INVOICE_FIRST_NUMBER_BOLETA`.

## Configuración en Render

En el servicio **airconsolution** → *Environment*, carga estas variables (nunca las subas a GitHub):

| Variable | Valor |
|---|---|
| `INVOICE_PROVIDER` | `SUNAT` |
| `SUNAT_MODE` | `BETA` para probar, `PRODUCCION` para comprobantes reales |
| `SUNAT_CERT_BASE64` | El archivo `.pfx` convertido a Base64 (ver abajo) |
| `SUNAT_CERT_PASSWORD` | Contraseña del `.pfx` |
| `SUNAT_SOL_USER` | Usuario SOL secundario, **sin** el RUC delante (p. ej. `FACTURA1`) |
| `SUNAT_SOL_PASSWORD` | Clave de ese usuario |

Convertir el certificado a Base64:

- Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\certificado.pfx")) | Set-Clipboard`
- Mac / Linux: `base64 -i certificado.pfx | tr -d '\n'`

Opcionales: `INVOICE_UBIGEO` (por defecto `150117`, Los Olivos) e `INVOICE_ESTABLISHMENT_CODE` (por defecto
`0000`, domicilio fiscal).

## Pruebas antes de producción

Con `SUNAT_MODE=BETA` el sistema usa el ambiente de pruebas de SUNAT (`e-beta.sunat.gob.pe`, usuario genérico
`MODDATOS`). Ahí puedes emitir y anular libremente: **los comprobantes no tienen validez tributaria**. Haz al menos
una factura, una boleta y una anulación de cada una. Cuando todo salga "Aceptada por SUNAT", cambia a
`SUNAT_MODE=PRODUCCION`.

> Los comprobantes emitidos en BETA quedan guardados con números F001/B001. Antes de pasar a producción borra
> esos registros de prueba o define `INVOICE_FIRST_NUMBER_*` para que la numeración real empiece donde corresponde.

## Alcance actual

- Operaciones gravadas con IGV 18 %, en soles, pago al contado.
- No incluye notas de crédito/débito, guías de remisión, ni facturas sujetas a **detracción** (servicios de
  mantenimiento e instalación desde S/ 700 suelen estarlo: requieren tipo de operación 1001, la cuenta del
  Banco de la Nación y la leyenda correspondiente).
- Plazo: SUNAT acepta comprobantes hasta 3 días después de la fecha de emisión; el panel ya lo controla.
