interface Question {
  id: string;
  questionNumber: string;
  questionText: string;
  answers: {
    label: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export class CrawlerService {
  static async extractQuestions(html: string): Promise<Question[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const questions: Question[] = [];

    const questionElements = doc.querySelectorAll('.flashCard');
    
    questionElements.forEach((element) => {
      const questionNumber = element.querySelector('.questionNumber')?.textContent?.trim() || '';
      const questionText = element.querySelector('.questionText')?.textContent?.trim() || '';
      const answers: Question['answers'] = [];

      element.querySelectorAll('li').forEach((li) => {
        const label = li.querySelector('.answerLabel')?.textContent?.trim() || '';
        const text = li.querySelector('.noMarks')?.textContent?.replace(label, '').trim() || '';
        const isCorrect = li.classList.contains('correctAnswer');

        answers.push({
          label,
          text,
          isCorrect
        });
      });

      questions.push({
        id: questionNumber,
        questionNumber,
        questionText,
        answers
      });
    });

    return questions;
  }
} 