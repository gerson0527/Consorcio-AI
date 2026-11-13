import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Política de privacidad | Consorcio AI" },
  description:
    "Cómo Consorcio AI trata los datos de quienes gestionan el crédito y de los clientes en preanálisis, y cómo se ejerce el habeas data.",
  alternates: { canonical: "/privacidad" },
};

const secciones = [
  {
    id: "responsable",
    titulo: "1. Responsable",
    parrafos: [
      "Consorcio Finance opera Consorcio AI, una herramienta de preanálisis crediticio. Esta política describe el tratamiento que hace el sistema.",
      "El software no publica NIT, domicilio ni un correo de privacidad propio. Esos datos son los de la organización que opera esta instalación. Las solicitudes de habeas data se atienden por el administrador de esa organización, dentro de la plataforma.",
    ],
  },
  {
    id: "alcance",
    titulo: "2. A quién aplica",
    parrafos: [
      "Aplica a dos grupos. El primero son las personas con cuenta para gestionar el crédito: analistas, administradores y auditores. El segundo son los clientes cuyos datos carga quien gestiona el caso, para comparar su perfil con las políticas de las entidades y ver la mejor opción.",
      "La plataforma recomienda y cita la política usada. No aprueba ni rechaza un crédito. No es una central de riesgo ni reporta el comportamiento de pago a terceros.",
    ],
  },
  {
    id: "datos",
    titulo: "3. Datos que trata",
    parrafos: [
      "De la cuenta de acceso: nombre, correo, contraseña almacenada con scrypt (no se guarda en claro) y rol.",
      "Del cliente: nombre y número de documento. El número se guarda cifrado con AES-256-GCM y, por separado, un hash SHA-256 que solo sirve para saber si ese documento ya existe. En pantalla se muestran los últimos cuatro dígitos.",
      "Del caso: tipo de crédito (libranza, consumo, vehículo o vivienda), archivos que sube quien gestiona (cédula, desprendibles, certificado laboral, extracto u otro), el perfil leído de esos archivos (ingreso, contrato, antigüedad, endeudamiento, edad y los campos que haya que revisar), el ranking de entidades, la explicación, la política citada y el resultado real que registra la persona (aprobado o rechazado, con motivo).",
      "De la autorización: la fecha y la finalidad «Preanálisis crediticio ante entidades financieras». La marca la persona que crea el cliente, confirmando que el cliente autorizó esa comparación. El sistema no archiva una firma escaneada en ese paso.",
      "De auditoría: usuario, acción, tipo de objeto, identificador, dirección IP y fecha. Sirve para saber quién hizo cada cambio.",
    ],
  },
  {
    id: "finalidad",
    titulo: "4. Para qué se usan",
    parrafos: [
      "Para que quien gestiona el crédito vea, en un solo caso, la opción que más se ajusta a la política vigente y avance la gestión con la fuente a la vista.",
      "Para leer los documentos, armar el perfil, comparar reglas de cada entidad y ordenar las opciones. Si el operador configura la clave de Coarena, el archivo se envía a ese proveedor solo para extraer el perfil. La instrucción de extracción pide no devolver el número de documento. Sin esa clave, la lectura se hace en el propio servidor y las secuencias largas de dígitos se enmascaran antes de interpretar el texto.",
      "Para calibrar, con resultados reales ya registrados, qué tan cerca estuvo la recomendación. Esa calibración guarda conteos y tasas, no el documento del cliente.",
      "Para controlar el acceso, registrar la auditoría y atender una supresión o una corrección.",
    ],
  },
  {
    id: "autorizacion",
    titulo: "5. Autorización",
    parrafos: [
      "Sin la confirmación de autorización no se crea el cliente, no se procesan sus documentos y no se evalúa el caso. La finalidad registrada es el preanálisis frente a las políticas de las entidades cargadas en el sistema.",
      "Quien gestiona el caso es quien debe contar con la autorización del cliente antes de marcar esa casilla. Revocarla se hace pidiendo la supresión al administrador.",
    ],
  },
  {
    id: "acceso",
    titulo: "6. Quién puede verlos",
    parrafos: [
      "El analista ve y edita clientes, documentos, evaluaciones y resultados, y consulta reportes. No aprueba reglas ni suprime datos.",
      "El administrador puede, además, cargar entidades y políticas, decidir reglas sugeridas y suprimir los datos personales del cliente.",
      "El auditor consulta clientes, entidades, reportes y el historial de acciones. No modifica casos.",
      "No hay un acceso público al caso. La portada, el ingreso y esta política son las únicas páginas abiertas sin sesión.",
    ],
  },
  {
    id: "encargados",
    titulo: "7. Encargados y transferencia",
    parrafos: [
      "Los datos se guardan en la base y el almacenamiento de la instalación que opera Consorcio Finance.",
      "Si el operador configura la clave de Coarena, el archivo del documento sale del servidor hacia Coarena (https://coarena.ai) para extraer datos estructurados. Ese tratamiento puede ocurrir fuera de Colombia. Sin esa clave, el archivo no se envía a un proveedor externo.",
      "Las políticas de las entidades se fragmentan para buscar el texto citado. Esos fragmentos son de la política, no del expediente del cliente.",
    ],
  },
  {
    id: "seguridad",
    titulo: "8. Seguridad",
    parrafos: [
      "El número de documento va cifrado. La contraseña no es reversible. El ingreso usa una sesión y cada rol solo abre lo que le corresponde. Los archivos se entregan con un enlace firmado. Las acciones quedan en auditoría.",
      "Nadie puede prometer que un sistema es imposible de vulnerar. El operador debe proteger la clave de cifrado, el secreto de sesión y el acceso al servidor.",
    ],
  },
  {
    id: "conservacion",
    titulo: "9. Conservación y supresión",
    parrafos: [
      "El sistema no borra los casos por calendario. Se conservan mientras hagan falta para el preanálisis, la calibración y la auditoría.",
      "El administrador puede suprimir los datos personales de un cliente. Al hacerlo, el nombre pasa a «Persona suprimida», el documento se reemplaza, el perfil extraído se borra y se eliminan los registros de los archivos. El historial de la evaluación puede quedar ligado a ese cliente ya sustituido, para no perder la auditoría ni la calibración.",
      "Esa supresión quita el registro del archivo en la base. No borra por sí sola la copia que esté en el disco o en el almacén de objetos. El operador debe retirar esa copia.",
      "La auditoría de la supresión se conserva, con el identificador del caso y la cantidad de documentos, sin el número de documento.",
    ],
  },
  {
    id: "derechos",
    titulo: "10. Derechos",
    parrafos: [
      "La persona puede conocer, actualizar y rectificar sus datos, solicitar prueba de la autorización, ser informada del uso, revocar la autorización y pedir la supresión cuando no exista un deber legal de conservarlos. También puede presentar una queja ante la Superintendencia de Industria y Comercio.",
      "En el sistema, el administrador corrige el nombre y el tipo de crédito mientras el caso no tenga un resultado final. El número de documento no se edita: es la identidad del registro. Si debe cambiar, la vía es la supresión y un registro nuevo, hecha por el administrador.",
      "La solicitud se presenta al administrador de la organización que opera Consorcio AI. No hay un formulario público de habeas data en esta versión.",
    ],
  },
  {
    id: "sesion",
    titulo: "11. Sesión",
    parrafos: [
      "El ingreso usa una cookie de sesión, necesaria para saber quién está autenticado. No se usan cookies de publicidad ni de medición de terceros en esta política.",
    ],
  },
  {
    id: "menores",
    titulo: "12. Menores de edad",
    parrafos: [
      "Consorcio AI no está dirigido a niños ni a adolescentes. El preanálisis es una herramienta de gestión de crédito para el equipo que opera la plataforma.",
    ],
  },
  {
    id: "cambios",
    titulo: "13. Cambios",
    parrafos: [
      "Si el tratamiento cambia, esta página se actualiza y se indica la fecha. La versión vigente es la publicada en /privacidad.",
      "Versión del 12 de noviembre de 2026.",
    ],
  },
];

export default function Privacidad() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">CF</span>
            Consorcio AI
          </Link>
          <Link href="/login" className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground">
            Ingresar
          </Link>
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="font-mono text-xs text-muted-foreground">Habeas data · Ley 1581 de 2012</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Política de privacidad</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Cómo Consorcio AI trata los datos de quien gestiona el crédito y de los clientes que se cargan para encontrar la mejor opción.
        </p>
        <nav aria-label="Contenido de la política" className="mt-8 flex flex-col gap-1 border-y py-4">
          {secciones.map((seccion) => (
            <a key={seccion.id} href={`#${seccion.id}`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              {seccion.titulo}
            </a>
          ))}
        </nav>
        <div className="mt-10 flex flex-col gap-10">
          {secciones.map((seccion) => (
            <section key={seccion.id} id={seccion.id} className="scroll-mt-20">
              <h2 className="text-xl font-semibold">{seccion.titulo}</h2>
              {seccion.parrafos.map((parrafo) => (
                <p key={parrafo} className="mt-3 text-sm leading-7 text-muted-foreground">
                  {parrafo}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <footer className="border-t">
        <p className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
          Consorcio Finance. El resultado mostrado es una recomendación, no una decisión de crédito.
        </p>
      </footer>
    </>
  );
}
