const QUESTIONS = [
  {
    number: '01',
    text: 'What did you lose?',
    hint: 'A person, a version of yourself, a feeling of safety, something else entirely. There is no wrong answer here.',
    placeholder: 'take your time…',
    key: 'loss'
  },
  {
    number: '02',
    text: 'What does the absence feel like?',
    hint: 'In your body, in your days. What shape does it take?',
    placeholder: 'describe it however feels right…',
    key: 'absence'
  },
  {
    number: '03',
    text: 'What is the first small thing you\'ve noticed returning?',
    hint: 'An appetite. A laugh. A morning where you didn\'t remember right away. Anything, even the smallest thing counts.',
    placeholder: 'even the smallest thing…',
    key: 'returning'
  },
  {
    number: '04',
    text: 'What are you ready to let be new?',
    hint: 'Not what you think you should feel — what you actually notice in yourself, beginning to stir.',
    placeholder: 'what\'s becoming possible…',
    key: 'new'
  }
];

let currentIndex = 0;
const answers = {};

const progressLabel = document.getElementById('progress-label');
const questionWrap  = document.getElementById('question-wrap');
const questionText  = document.getElementById('question-text');
const questionHint  = document.getElementById('question-hint');
const questionInput = document.getElementById('question-input');
const btnBack       = document.getElementById('btn-back');
const btnNext       = document.getElementById('btn-next');
const questionPage  = document.getElementById('question-page');
const loadingScreen = document.getElementById('loading-screen');

function renderQuestion(index, direction = 'forward') {
  const q = QUESTIONS[index];

  // Animate out
  questionWrap.classList.add('exiting');

  setTimeout(() => {
    // Swap content
    progressLabel.textContent = `${q.number} / 04`;
    questionText.textContent  = q.text;
    questionHint.textContent  = q.hint;
    questionInput.placeholder = q.placeholder;
    questionInput.value       = answers[q.key] || '';

    // Back button visibility
    btnBack.style.visibility = index === 0 ? 'hidden' : 'visible';

    // Next button label
    btnNext.textContent = index === QUESTIONS.length - 1 ? 'find my bloom →' : 'next →';

    // Animate in
    questionWrap.classList.remove('exiting');
    questionWrap.classList.add('entering');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        questionWrap.classList.remove('entering');
        questionInput.focus();
      });
    });
  }, 300);
}

function goNext() {
  const value = questionInput.value.trim();
  if (!value) {
    questionInput.focus();
    questionInput.style.borderBottomColor = 'var(--accent)';
    setTimeout(() => {
      questionInput.style.borderBottomColor = '';
    }, 800);
    return;
  }

  answers[QUESTIONS[currentIndex].key] = value;

  if (currentIndex < QUESTIONS.length - 1) {
    currentIndex++;
    renderQuestion(currentIndex, 'forward');
  } else {
    submitAnswers();
  }
}

function goBack() {
  if (currentIndex > 0) {
    const value = questionInput.value.trim();
    if (value) answers[QUESTIONS[currentIndex].key] = value;
    currentIndex--;
    renderQuestion(currentIndex, 'back');
  }
}

// Allow Enter key to advance (Shift+Enter for newline in textarea)
questionInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    goNext();
  }
});

async function submitAnswers() {
  // Show loading
  questionPage.style.display  = 'none';
  loadingScreen.style.display = 'flex';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch('/.netlify/functions/generate-bloom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loss:      answers.loss,
        absence:   answers.absence,
        returning: answers.returning,
        new:       answers.new
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error('API error');

    const data = await res.json();

    // Store in sessionStorage for the bloom page
    sessionStorage.setItem('bloomData', JSON.stringify({
      ...data,
      answers,
      created_at: new Date().toISOString()
    }));

    window.location.href = '/bloom';
  } catch (err) {
    console.error('Bloom generation failed:', err);
    // Show error state
    loadingScreen.innerHTML = `
      <p class="loading-text" style="color: var(--text-muted); font-style: italic; font-family: var(--font-display);">
        Something went quiet. Please try again.
      </p>
      <a href="/questions" class="btn btn-outline" style="margin-top:1rem">try again</a>
    `;
  }
}

// Init
renderQuestion(0);
