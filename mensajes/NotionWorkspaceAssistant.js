//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class NotionWorkspaceAssistant {
  constructor(notionApiKey, databaseId) {
    this.notionApiKey = notionApiKey;
    this.databaseId = databaseId;
    this.notionBaseUrl = "https://api.notion.com/v1";
    this.notionHeaders = {
      'Authorization': `Bearer ${this.notionApiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    };
  }

  async queryNotion(query) {
    const url = `${this.notionBaseUrl}/databases/${this.databaseId}/query`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.notionHeaders,
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    return await response.json();
  }

  async getCourseData() {
    const query = {
      filter: {
        property: 'Estado',
        select: {
          equals: 'Sin empezar'
        }
      }
    };
    const response = await this.queryNotion(query);
    return response.results.map(course => ({
      id: course.properties.ID.rich_text[0].text.content,
      codeCB: course.properties['CÓDIGO CB'].rich_text[0].text.content,
      state: course.properties.Estado.select.name,
      category: course.properties.Categoría.select.name,
      level: course.properties.Nivel.select.name,
      description: course.properties.Descripción.rich_text[0].text.content,
      registrationLink: course.properties['Enlace de Inscripción'].url,
      startDate: course.properties['Fecha de Inicio'].date.start,
      endDate: course.properties['Fecha de Finalización'].date.end,
      schedule: course.properties.Horario.rich_text[0].text.content,
      requirements: course.properties.Requisitos.rich_text[0].text.content,
      location: course.properties.Ubicación.rich_text[0].text.content,
      resources: course.properties.Recursos.rich_text[0].text.content,
      price: course.properties.Precio.number,
      discountPrice: course.properties['Precio con Descuento'].number
    }));
  }

  async listCourses() {
    const courses = await this.getCourseData();
    return courses.map(course => course.description);
  }

  async getCourseSchedule(courseId) {
    const courses = await this.getCourseData();
    const course = courses.find(c => c.id === courseId);
    return course ? course.schedule : 'Curso no encontrado';
  }

  async getCoursePrice(courseId) {
    const courses = await this.getCourseData();
    const course = courses.find(c => c.id === courseId);
    return course ? { price: course.price, discountPrice: course.discountPrice } : 'Curso no encontrado';
  }

  async getCourseRequirements(courseId) {
    const courses = await this.getCourseData();
    const course = courses.find(c => c.id === courseId);
    return course ? course.requirements : 'Curso no encontrado';
  }

  // Otros métodos para responder a preguntas específicas...

  async answerQuestion(question) {
    // Interpretación básica de la pregunta
    if (question.toLowerCase().includes("cursos disponibles")) {
      return this.listCourses();
    } else if (question.toLowerCase().includes("horario")) {
      const courseId = "CUR-45"; // Podrías extraer el ID del curso de la pregunta o contexto
      return this.getCourseSchedule(courseId);
    } else if (question.toLowerCase().includes("precio")) {
      const courseId = "CUR-45";
      return this.getCoursePrice(courseId);
    } else if (question.toLowerCase().includes("requisitos")) {
      const courseId = "CUR-45";
      return this.getCourseRequirements(courseId);
    }

    return "No puedo responder esa pregunta con la información disponible.";
  }
}

module.exports = { NotionWorkspaceAssistant };



