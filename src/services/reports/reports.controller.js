import axios from "axios";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const obtenerResultados = async (req, res) => {
  try {
    // 1. Obtener lista de lecciones
    const response = await axios.get('http://127.0.0.1:8000/api/leccion');
    const listaLecciones = obtenerNombresLecciones(response.data);

    // Verificar si hay datos en la respuesta
    if (!listaLecciones.length) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron lecciones"
      });
    }

    // 2. Generar el examen con OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates English tests. Please generate the response in valid JSON format."
        },
        {
          role: "user",
          content: `Based on the following topics: ${listaLecciones.join(", ")}, generate an English level test with 20 questions in "JSON and nothing else" the first 5 questios will be A1 , the other 5 A2, the following 5 will be B1 and B2 and the last five will be C1 and C2 level format following this structure:
          {
            "title": "English Level Test",
            "questions": [
              {
                "question": "Question 1: How do you greet someone in the morning?",
                "type": "text",
                "answer": "Your answer here"
              },
              {
                "question": "Question 2: Choose the correct comparative form: 'She is ____ than her sister.'",
                "type": "multiple_choice",
                "options": [
                  "a) tall",
                  "b) taller",
                  "c) tallest"
                ],
                "answer": "b) taller"
              }
            ]
          }`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    // 3. Procesar y enviar la respuesta
    const generatedTest = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      success: true,
      data: generatedTest
    });

  } catch (error) {
    // Manejo de errores más específico
    console.error("Error en obtenerResultados:", {
      message: error.message,
      stack: error.stack
    });

    // Determinar el tipo de error y enviar una respuesta apropiada
    if (error.name === 'SyntaxError') {
      return res.status(500).json({
        success: false,
        message: "Error al procesar la respuesta de OpenAI",
        error: error.message
      });
    }

    if (error.response) {
      // Error de la API de lecciones o OpenAI
      const statusCode = error.response.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: "Error al generar el examen",
        error: error.response.data?.message || error.message
      });
    }

    // Error genérico
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const entregarNivelDeIngles = async (req, res) => {
  try {
    // 1. Obtener las respuestas del examen desde el cuerpo de la solicitud
    const { questions } = req.body;

    // Validar la estructura de entrada
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "Formato incorrecto: se esperaba un array de preguntas",
      });
    }

    // Validar que cada pregunta tiene el formato correcto
    if (!questions.every(q => typeof q.question === "string" && typeof q.answer === "string")) {
      return res.status(400).json({
        success: false,
        message: "Cada pregunta debe tener una clave 'question' y una clave 'answer', ambas de tipo string.",
      });
    }

    // 2. Preparar las respuestas para enviarlas a OpenAI
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that evaluates English test answers. Provide the response in valid JSON format with recommendations for each question.",
      },
      {
        role: "user",
        content: `Evaluate the following test answers and provide the results in this format if all questions are answered correctly then the level is C2, the other ones you have to determine the recommendations for each question must be in spanish the answer must be in Json and nothing else: 
        {
          "nivel": "A1, A2, B1 .... C2",
          "recomendaciones": [
            "Recommendation for question 1",
            "Recommendation for question 2",
            ...
          ]
        }
        
        Answers: ${JSON.stringify(questions)}`,
      },
    ];

  

    // 3. Realizar la solicitud a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    
// 4. Procesar y validar la respuesta de OpenAI
let result;
try {
  // Limpia la respuesta eliminando bloques de código (```json y ```)
  const rawContent = completion.choices[0].message.content;
  const cleanedContent = rawContent.replace(/```(?:json)?|```/g, "").trim();

  // Intenta parsear el JSON limpio
  result = JSON.parse(cleanedContent);
} catch (parseError) {
  console.error("Error al parsear la respuesta de OpenAI:", parseError.message);
  return res.status(500).json({
    success: false,
    message: "La respuesta de OpenAI no se pudo parsear correctamente.",
    error: parseError.message,
  });
}


    // Validar que la respuesta contiene las claves esperadas
    if (!result.nivel || !Array.isArray(result.recomendaciones)) {
      return res.status(500).json({
        success: false,
        message: "Respuesta de OpenAI inválida: faltan claves esperadas 'nivel' o 'recomendaciones'.",
        data: result,
      });
    }

    //aqui se puede hacer un post a la base de datos para guardar el resultado para marcar todos los niveles anteriores
    const nivel = result.nivel;
    console.log(nivel)
    



    // 5. Devolver el resultado procesado al cliente
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Manejo de errores generales
    console.error("Error en entregarNivelDeIngles:", {
      message: error.message,
      stack: error.stack,
    });

    // Verificar si el error viene de OpenAI
    if (error.response) {
      console.error("Error en la respuesta de OpenAI:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: "Error al procesar la evaluación con OpenAI",
        error: error.response.data?.message || error.message,
      });
    }

    // Error genérico
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

const obtenerNombresLecciones = (data) => {
  return data.map(leccion => leccion.nombre);
};

export const reportsController = {
  obtenerResultados,
  entregarNivelDeIngles
};