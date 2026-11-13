# Cuadrículas reales incluidas

Estas dos cuadrículas proceden de NOAA PSL, NCEP–NCAR Reanalysis 1, variable `air` a 2 m, medias diarias UTC del 15 de junio y 15 de diciembre de 2024. No son datos simulados ni imágenes. El backend las sirve mediante el mismo contrato que cualquier descarga posterior, y el navegador genera una textura nueva a partir de sus valores.

Cada archivo JSON comprimido conserva URL de consulta, fecha de recuperación, SHA-256 del NetCDF original, coordenadas nativas, unidades, temperaturas en °C y límites de interpretación. El redondeo de entrega es 0.01 °C; no implica esa exactitud observacional.

La muestra de junio es la fecha inicial del explorador. Ambas funcionan sin consultar NOAA después de instalar las dependencias. Otras fechas válidas necesitan conexión al archivo remoto o una copia en caché.

Fuente: https://psl.noaa.gov/data/gridded/data.ncep.reanalysis.html
Archivo: https://psl.noaa.gov/thredds/catalog/Datasets/ncep.reanalysis/Dailies/surface_gauss/catalog.html

Las cuadrículas se obtuvieron solicitando `var=air`, `time=YYYY-MM-DDT00:00:00Z`, `accept=netcdf3` al servicio NCSS del archivo anual correspondiente.
