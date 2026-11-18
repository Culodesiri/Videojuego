// Shows a sequence of lines with a typewriter effect; click or Enter advances.
export class DialogueManager {
  constructor(root) {
    this.root = root;
    this.nameEl = root.querySelector('.dialogue-name');
    this.textEl = root.querySelector('.dialogue-text');
    this.lines = [];
    this.onDone = null;
    this.timer = null;
    this.typing = false;
    this.fullText = '';
    root.addEventListener('click', () => this.advance());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && root.classList.contains('active')) this.advance();
    });
  }

  start(lines, onDone) {
    this.lines = [...lines];
    this.onDone = onDone;
    this.next();
  }

  next() {
    const line = this.lines.shift();
    if (!line) { this.onDone(); return; }
    this.nameEl.textContent = line.speaker;
    this.type(line.text);
  }

  type(text) {
    clearInterval(this.timer);
    this.fullText = text;
    this.typing = true;
    this.textEl.textContent = '';
    let i = 0;
    this.timer = setInterval(() => {
      this.textEl.textContent = text.slice(0, ++i);
      if (i >= text.length) this.finishTyping();
    }, 25);
  }

  finishTyping() {
    clearInterval(this.timer);
    this.textEl.textContent = this.fullText;
    this.typing = false;
  }

  advance() {
    if (this.typing) this.finishTyping();
    else this.next();
  }
}
