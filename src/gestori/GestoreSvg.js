class GestoreSvg {
    constructor() {
        this.svg = null;
        this.isLoaded = false;
        this.opacita = 0;
        this.targetOpacita = 0;
        this.tentativi = 0;
        this.maxTentativi = 3;
        this.caricaSVG();
    }

    caricaSVG() {
        const percorsoSVG = 'svg/cella.svg';
        console.log('Tentativo di caricamento SVG:', percorsoSVG);
        
        loadImage(percorsoSVG, 
            (img) => {
                if (img.width === 0 || img.height === 0) {
                    console.warn('SVG caricato ma invalido, riprovo...');
                    if (this.tentativi < this.maxTentativi) {
                        this.tentativi++;
                        setTimeout(() => this.caricaSVG(), 1000);
                    }
                    return;
                }
                console.log('SVG caricato correttamente:', img.width, 'x', img.height);
                this.svg = img;
                this.isLoaded = true;
            },
            (err) => {
                console.error('Errore nel caricamento dell\'SVG:', err);
                if (this.tentativi < this.maxTentativi) {
                    this.tentativi++;
                    setTimeout(() => this.caricaSVG(), 1000);
                }
            }
        );
    }

    impostaOpacita(valore) {
        this.targetOpacita = valore;
    }

    aggiornaOpacita() {
        this.opacita = lerp(this.opacita, this.targetOpacita, CONFIGURAZIONE.animazioni.easing);
    }

    visualizza(esagonoIngrandito) {
        if (!this.isLoaded || !esagonoIngrandito) {
            return;
        }

        try {
            this.aggiornaOpacita();
            
            push();
            tint(255, this.opacita * 255);
            
            const config = CONFIGURAZIONE.svg.proporzioni;
            let svgWidth = esagonoIngrandito.raggio * esagonoIngrandito.scaleMultiplier * config.larghezza;
            let svgHeight = svgWidth * config.rapporto;
            let svgX = esagonoIngrandito.x - svgWidth / 2;
            let svgY = esagonoIngrandito.y - svgHeight / 2;
            
            image(this.svg, svgX, svgY, svgWidth, svgHeight);
            pop();
        } catch (error) {
            console.error('Errore nel disegno dell\'SVG:', error);
        }
    }
} 