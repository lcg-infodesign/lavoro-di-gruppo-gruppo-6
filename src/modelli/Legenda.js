class Legenda {
    constructor(font) {
        this.testoComune = [
            "",
            "Il colore degli esagoni indica",
            "progressivamente il livello",
            "di sovraffollamento del carcere.",
        ];

        this.testiPerFase = {
            italia: [
                "Questa è la situazione delle",
                "carceri nel nostro paese.",
                "Passando il mouse sopra gli esagoni e",
                "cliccando potrai ottenere più informazioni."
            ]
        };

        this.faseCorrente = 'italia';
        this.testo = [...this.testiPerFase[this.faseCorrente], ...this.testoComune];
        this.testoEsagoni = [
            "Grave sovraffollamento",
            "Nei limiti normativi"
        ];
        this.testoCorrente = [];
        this.rigaCorrente = 0;
        this.indice = 0;
        this.testoEsagoniCorrente = ["", ""];
        this.rigaEsagoniCorrente = 0;
        this.indiceEsagoni = 0;
        this.velocitaScrittura = 10;
        this.ultimoAggiornamento = 0;
        this.font = font;
        this.altezzaRiga = 20;
        this.esagoni = [
            new Esagono(width / 13 + 15, height - 150, 15, "regione1", color("red"), "1"),
            new Esagono(width / 13 + 15, height - 100, 15, "regione2", color("white"), "2")
        ];
        
        this.esagoni[1].sovraffollamento = 150;
        this.esagoni[1].attivaAnimazione();

        this.esagoni.forEach(esagono => {
            esagono.hoverState = 1;
        });

        this.opacitaPrimoEsagono = 0;
        this.opacitaSecondoEsagono = 0;
        this.lunghezzaLinea = 0;
        this.inizioAnimazione = 0;
        this.durataFadeIn = 1000;
        this.durataLinea = 1000;
        this.animazionePartita = false;
    }

    disegna() {
        push();
        fill(255);
        noStroke();
        textFont(this.font);
        textSize(16);
        textAlign(LEFT, CENTER);

        for (let i = 0; i < this.testoCorrente.length; i++) {
            text(this.testoCorrente[i], width / 13, height - 270 + (i - 4) * this.altezzaRiga);
        }

        if (this.rigaCorrente >= this.testo.length) {
            if (!this.animazionePartita) {
                this.inizioAnimazione = millis();
                this.animazionePartita = true;
            }

            let tempoTrascorso = millis() - this.inizioAnimazione;
            
            this.opacitaPrimoEsagono = min(255, map(tempoTrascorso, 0, this.durataFadeIn, 0, 255));
            
            if (tempoTrascorso > this.durataFadeIn) {
                let tempoLinea = tempoTrascorso - this.durataFadeIn;
                this.lunghezzaLinea = min(50, map(tempoLinea, 0, this.durataLinea, 0, 50));
                
                if (tempoLinea > this.durataLinea/2) {
                    this.opacitaSecondoEsagono = min(255, map(tempoLinea - this.durataLinea/2, 0, this.durataFadeIn, 0, 255));
                }
            }

            if (this.lunghezzaLinea > 0) {
                stroke(255);
                strokeWeight(3);
                line(width / 13 + 15, height - 150, width / 13 + 15, height - 150 + this.lunghezzaLinea);
                noStroke();
            }

            if (this.opacitaPrimoEsagono > 0) {
                this.esagoni[0].x = width / 13 + 15;
                this.esagoni[0].y = height - 150;
                this.esagoni[0].opacita = this.opacitaPrimoEsagono;
                this.esagoni[0].disegna();
                fill(255);
                text(this.testoEsagoniCorrente[0], width / 13 + 45, height - 152);
            }
            
            if (this.opacitaSecondoEsagono > 0) {
                this.esagoni[1].x = width / 13 + 15;
                this.esagoni[1].y = height - 100;
                this.esagoni[1].opacita = this.opacitaSecondoEsagono;
                this.esagoni[1].disegna();
                fill(255);
                text(this.testoEsagoniCorrente[1], width / 13 + 45, height - 102);
            }
        }
        
        pop();

        if (millis() - this.ultimoAggiornamento > this.velocitaScrittura) {
            if (this.rigaCorrente < this.testo.length) {
                if (this.indice === 0) {
                    this.testoCorrente.push("");
                }
                
                if (this.indice < this.testo[this.rigaCorrente].length) {
                    this.testoCorrente[this.rigaCorrente] += this.testo[this.rigaCorrente].charAt(this.indice);
                    this.indice++;
                } else {
                    this.rigaCorrente++;
                    this.indice = 0;
                }
                this.ultimoAggiornamento = millis();
            }
            else if (this.rigaEsagoniCorrente < this.testoEsagoni.length) {
                if (this.rigaEsagoniCorrente === 1 && 
                    millis() - this.inizioAnimazione <= this.durataFadeIn + this.durataLinea/2) {
                    return;
                }
                
                if (this.indiceEsagoni < this.testoEsagoni[this.rigaEsagoniCorrente].length) {
                    this.testoEsagoniCorrente[this.rigaEsagoniCorrente] += 
                        this.testoEsagoni[this.rigaEsagoniCorrente].charAt(this.indiceEsagoni);
                    this.indiceEsagoni++;
                } else {
                    this.rigaEsagoniCorrente++;
                    this.indiceEsagoni = 0;
                }
                this.ultimoAggiornamento = millis();
            }
        }
    }

    reset() {
        this.testoCorrente = [];
        this.testoEsagoniCorrente = ["", ""];
        this.rigaCorrente = 0;
        this.rigaEsagoniCorrente = 0;
        this.indice = 0;
        this.indiceEsagoni = 0;
        this.opacitaPrimoEsagono = 0;
        this.opacitaSecondoEsagono = 0;
        this.lunghezzaLinea = 0;
        this.animazionePartita = false;
    }

    cambiaFase(nuovaFase) {
        if (this.faseCorrente !== nuovaFase) {
            this.faseCorrente = nuovaFase;
            this.testo = [...this.testiPerFase[nuovaFase], ...this.testoComune];
            this.reset();
        }
    }
}
