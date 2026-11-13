# Informe de extracción

No hay todavía 20 a 30 casos reales anonimizados. La medición de abajo usa documentos de texto sintéticos, no papeles de clientes.

Sobre el desprendible de ejemplo con empleador, periodo, salario, devengado y deducciones, el extractor sintético acierta los cinco campos (precisión 1). Si falta un campo, el valor queda en null, la confianza baja de 0.8 y el documento pasa a `REVISAR`. Dos empleadores distintos entre desprendible y certificado marcan el perfil para revisión.

Esa cifra no describe el desempeño de Claude sobre PDF o fotos. Hay que repetirla cuando lleguen los casos anonimizados y una clave `sk-ant-`.
