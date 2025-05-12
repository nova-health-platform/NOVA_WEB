import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-smartpred',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './smartpred.component.html',
  styleUrls: ['./smartpred.component.scss']
})
export class SmartpredComponent {
  step: 'intro' | 'demographics' | 'questions' | 'tipi' | 'vcl' | 'result' = 'intro';
  currentIndex = 0;
  currentQuestionIndex = 0;
  tipiIndex = 0;
  startTime = 0;

  depressionScore = 0;
  anxietyScore = 0;
  stressScore = 0;
  depressionLabel = '';
  anxietyLabel = '';
  stressLabel = '';

  demographics = {
    education: null,
    urban: null,
    gender: null,
    age: null,
    married: null,
    familysize: null
  };

  questions = [
    { text: 'I found myself getting upset by quite trivial things.', answer: null },
    { text: 'I was aware of dryness of my mouth.', answer: null },
    { text: "I couldn't seem to experience any positive feeling at all.", answer: null },
    { text: 'I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness).', answer: null },
    { text: "I just couldn't seem to get going.", answer: null },
    { text: 'I tended to over-react to situations.', answer: null },
    { text: 'I had a feeling of shakiness (e.g., legs going to give way).', answer: null },
    { text: 'I found it difficult to relax.', answer: null },
    { text: 'I found myself in situations that made me so anxious I was most relieved when they ended.', answer: null },
    { text: 'I felt that I had nothing to look forward to.', answer: null },
    { text: 'I found myself getting upset rather easily.', answer: null },
    { text: 'I felt that I was using a lot of nervous energy.', answer: null },
    { text: 'I felt sad and depressed.', answer: null },
    { text: 'I found myself getting impatient when I was delayed in any way.', answer: null },
    { text: 'I had a feeling of faintness.', answer: null },
    { text: 'I felt that I had lost interest in just about everything.', answer: null },
    { text: "I felt I wasn't worth much as a person.", answer: null },
    { text: 'I felt that I was rather touchy.', answer: null },
    { text: 'I perspired noticeably (e.g., hands sweaty) in the absence of exertion.', answer: null },
    { text: 'I felt scared without any good reason.', answer: null },
    { text: "I felt that life wasn't worthwhile.", answer: null },
    { text: 'I found it hard to wind down.', answer: null },
    { text: 'I had difficulty in swallowing.', answer: null },
    { text: "I couldn't seem to get any enjoyment out of the things I did.", answer: null },
    { text: 'I was aware of the action of my heart in the absence of exertion.', answer: null },
    { text: 'I felt down-hearted and blue.', answer: null },
    { text: 'I found that I was very irritable.', answer: null },
    { text: 'I felt I was close to panic.', answer: null },
    { text: 'I found it hard to calm down after something upset me.', answer: null },
    { text: 'I feared that I would be "thrown" by some trivial but unfamiliar task.', answer: null },
    { text: 'I was unable to become enthusiastic about anything.', answer: null },
    { text: 'I found it difficult to tolerate interruptions to what I was doing.', answer: null },
    { text: 'I was in a state of nervous tension.', answer: null },
    { text: 'I felt I was pretty worthless.', answer: null },
    { text: 'I was intolerant of anything that kept me from getting on with what I was doing.', answer: null },
    { text: 'I felt terrified.', answer: null },
    { text: 'I could see nothing in the future to be hopeful about.', answer: null },
    { text: 'I felt that life was meaningless.', answer: null },
    { text: 'I found myself getting agitated.', answer: null },
    { text: 'I was worried about situations in which I might panic and make a fool of myself.', answer: null },
    { text: 'I experienced trembling (e.g., in the hands).', answer: null },
    { text: 'I found it difficult to work up the initiative to do things.', answer: null }
  ];

  tipi = Array(10).fill(null);
  tipiQuestions = [
    'Extraverted, enthusiastic',
    'Critical, quarrelsome',
    'Dependable, self-disciplined',
    'Anxious, easily upset',
    'Open to new experiences, complex',
    'Reserved, quiet',
    'Sympathetic, warm',
    'Disorganized, careless',
    'Calm, emotionally stable',
    'Conventional, uncreative'
  ];

  vcl = Array(16).fill(false);
  vclWords = [
    'boat', 'incoherent', 'pallid', 'robot', 'audible', 'cuivocal', 'paucity', 'epistemology',
    'florted', 'decide', 'pastiche', 'verdid', 'abysmal', 'lucid', 'betray', 'funny'
  ];

  options = [
    { label: 'Did not apply to me at all', value: 1 },
    { label: 'Applied to me to some degree, or some of the time', value: 2 },
    { label: 'Applied to me to a considerable degree, or a good part of the time', value: 3 },
    { label: 'Applied to me very much, or most of the time', value: 4 }
  ];

  constructor(private http: HttpClient) {}

  get progress(): number {
    const totalSteps = 6 + this.questions.length + this.tipi.length + 1; // demographics + dass + tipi + vcl
    const completed = this.step === 'demographics' ? this.currentIndex
      : this.step === 'questions' ? 6 + this.currentQuestionIndex
      : this.step === 'tipi' ? 6 + this.questions.length + this.tipiIndex
      : this.step === 'vcl' ? 6 + this.questions.length + this.tipi.length
      : totalSteps;
    return (completed / totalSteps) * 100;
  }

  startTest() {
    this.step = 'demographics';
    this.currentIndex = 0;
    this.startTime = Date.now();
  }

  nextDemographicStep() {
    if (this.currentIndex < 5) {
      this.currentIndex++;
    } else {
      this.step = 'questions';
      this.currentQuestionIndex = 0;
    }
  }

  nextQuestion() {
    if (this.questions[this.currentQuestionIndex].answer == null) {
      alert('Please answer the question.');
      return;
    }
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.step = 'tipi';
      this.tipiIndex = 0;
    }
  }

  nextTipiQuestion() {
    if (this.tipi[this.tipiIndex] == null) {
      alert('Please select a value.');
      return;
    }
    if (this.tipiIndex < this.tipi.length - 1) {
      this.tipiIndex++;
    } else {
      this.step = 'vcl';
    }
  }

  submitVCL() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const payload = {
      answers: this.questions.map(q => q.answer),
      tipi: this.tipi,
      vcl: this.vcl,
      demographics: this.demographics,
      testelapse: elapsed
    };

    this.http.post<any>('http://localhost:5000/api/mental-health/analyze', payload).subscribe({
      next: (res) => {
        this.depressionScore = res.depression;
        this.anxietyScore = res.anxiety;
        this.stressScore = res.stress;
        this.depressionLabel = res.labels.depression;
        this.anxietyLabel = res.labels.anxiety;
        this.stressLabel = res.labels.stress;
        this.step = 'result';
      },
      error: (err) => {
        alert('Failed to analyze.');
        console.error(err);
      }
    });
  }

  reset() {
    this.step = 'intro';
    this.currentIndex = 0;
    this.currentQuestionIndex = 0;
    this.tipiIndex = 0;
    this.startTime = 0;
    this.depressionScore = 0;
    this.anxietyScore = 0;
    this.stressScore = 0;
    this.depressionLabel = '';
    this.anxietyLabel = '';
    this.stressLabel = '';
    this.demographics = {
      education: null,
      urban: null,
      gender: null,
      age: null,
      married: null,
      familysize: null
    };
    this.questions.forEach(q => q.answer = null);
    this.tipi.fill(null);
    this.vcl.fill(false);
  }
}
