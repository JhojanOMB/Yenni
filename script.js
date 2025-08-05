class FlipBook {
    constructor(bookElem) {
        this.book = bookElem;
        this.leaves = [...bookElem.querySelectorAll('.hoja')];
        this.current = 0;
        this.max = this.leaves.length;
        this.init();
    }

    init() {
        this.update();

        // Evento para cambiar de hoja
        this.book.addEventListener('click', e => {
            // Si haces clic en un enlace, deja que navegue normalmente
            if (e.target.closest('a')) return;

            const { left, width } = this.book.getBoundingClientRect();
            const x = e.clientX - left;

            if (x > width / 2 && this.current < this.max) this.current++;
            if (x <= width / 2 && this.current > 0) this.current--;

            this.update();
        });
    }

    update() {
        this.leaves.forEach((leaf, idx) => {
            const pos = idx < this.current;
            leaf.style.transform = pos ? 'rotateY(-180deg)' : 'rotateY(0deg)';
            leaf.style.zIndex = pos ? idx : this.max - idx;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FlipBook(document.getElementById('flipbook'));
});
