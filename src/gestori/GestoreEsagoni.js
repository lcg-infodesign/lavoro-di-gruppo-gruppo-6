class GestoreEsagoni {
    constructor(gestoreMappa) {
        this.gestoreMappa = gestoreMappa;
        this.esagonoIngrandito = null;
        
        const config = CONFIGURAZIONE;
        this.OFFSET_ITALIA_X = -width * config.layout.offset.italia.x;
        this.OFFSET_REGIONE_X = width * config.layout.offset.regione.x;
        this.DURATA_ANIMAZIONE = config.animazioni.durata.transizione;
        this.DURATA_INGRANDIMENTO = config.animazioni.durata.ingrandimento;
        
        this.SCALA = {
            PICCOLA: config.layout.scala.piccola,
            PIU_PICCOLA: config.layout.scala.piuPiccola,
            NORMALE: config.layout.scala.normale,
            GRANDE: config.layout.scala.grande,
            PUNTO: config.layout.scala.punto
        };
        
        this.tempoInizioAnimazione = 0;
        this.inIngrandimento = false;
        this.inRiduzione = false;
        this.tempoInizioRiduzione = 0;
        this.gestoreCella = new GestoreCella();
        this.sovraffollamentoCorrente = 0;
        this.posizioniOriginali = new Map();
    }

    inizializzaPosizioniOriginali(esagono) {
        if (!this.posizioniOriginali.has(esagono)) {
            this.posizioniOriginali.set(esagono, {
                x: esagono.originalX,
                y: esagono.originalY,
                scala: esagono.targetScale
            });
        }
    }

    ripristinaPosizioneOriginale(esagono) {
        const posOriginale = this.posizioniOriginali.get(esagono);
        if (posOriginale) {
            esagono.targetX = posOriginale.x;
            esagono.targetY = posOriginale.y;
            esagono.targetScale = posOriginale.scala;
        }
    }

    calcolaCentroRegione(esagoni) {
        return {
            x: esagoni.reduce((sum, h) => sum + h.originalX, 0) / esagoni.length,
            y: esagoni.reduce((sum, h) => sum + h.originalY, 0) / esagoni.length
        };
    }

    spostaEsagoniItalia(scala = this.SCALA.PICCOLA, offsetX = width * 0.1) {
        const esagoniItalia = this.gestoreMappa.esagoni.filter(e => 
            e.regione !== this.gestoreMappa.regioneSelezionata
        );

        esagoniItalia.forEach(hex => {
            this.inizializzaPosizioniOriginali(hex);
            hex.targetX = hex.originalX * 0.3 + width * -0.01;
            hex.targetY = hex.originalY * 0.3 + height * 0.35;
            hex.targetScale = 0.3;
        });
    }

    spostaEsagoniRegione(regioneEsagoni, centro, scala, offsetX = 0) {
        regioneEsagoni.forEach(hex => {
            const offsetXFromCenter = hex.originalX - centro.x;
            const offsetYFromCenter = hex.originalY - centro.y;
            hex.targetX = offsetX + offsetXFromCenter * scala;
            hex.targetY = height * 0.5 + offsetYFromCenter * scala;
            hex.targetScale = scala;
            
            if (hex.dot) {
                if (scala !== this.SCALA.NORMALE) {
                    hex.dot.targetScale = 0;
                } else {
                    hex.dot.targetScale = 1;
                }
            }
        });
    }

    gestisciClickEsagonoRegione(esagonoCliccato) {
        const regioneEsagoni = this.gestoreMappa.esagoni.filter(e => 
            e.regione === this.gestoreMappa.regioneSelezionata
        );
        const centro = this.calcolaCentroRegione(regioneEsagoni);

        if (this.esagonoIngrandito) {
            const esagonoIngrandito = this.esagonoIngrandito;
            this.inRiduzione = true;
            this.tempoInizioRiduzione = millis();
            esagonoIngrandito.targetScale = this.SCALA.NORMALE;
            esagonoIngrandito.disattivaAnimazione();
            
            gestoreSvg.impostaOpacita(0);
            
            setTimeout(() => {
                this.inRiduzione = false;
                this.ripristinaPosizioneOriginale(esagonoIngrandito);
                this.esagonoIngrandito = null;

                regioneEsagoni.forEach(hex => {
                    const offsetX = hex.originalX - centro.x;
                    const offsetY = hex.originalY - centro.y;
                    hex.targetX = width * 0.5 + offsetX * 1.5;
                    hex.targetY = height * 0.5 + offsetY * 1.5;
                    hex.targetScale = 1.5;
                });

                this.spostaEsagoniItalia(this.SCALA.PICCOLA, width * 0.1);
                this.gestoreCella.aggiornaSovraffollamento(0, 0);
            }, this.DURATA_INGRANDIMENTO);

            this.gestoreTesto.setCarceraRimpicciolito(true);
        } else {
            regioneEsagoni.forEach(hex => {
                this.inizializzaPosizioniOriginali(hex);
                if (hex === esagonoCliccato) {
                    hex.targetX = width * 0.5;
                    hex.targetY = height * 0.5;
                    hex.targetScale = 1.5;
                    this.esagonoIngrandito = hex;
                    this.tempoInizioAnimazione = millis();
                    
                    gestoreSvg.impostaOpacita(0);
                    
                    setTimeout(() => {
                        if (this.esagonoIngrandito === hex) {
                            hex.targetScale = this.SCALA.GRANDE;
                            this.inIngrandimento = true;
                            this.tempoInizioIngrandimento = millis();
                            gestoreSvg.impostaOpacita(1);
                            hex.attivaAnimazione();
                        }
                    }, 500);
                } else {
                    const offsetXFromCenter = hex.originalX - centro.x;
                    const offsetYFromCenter = hex.originalY - centro.y;
                    hex.targetX = width * 0.15 + offsetXFromCenter * this.SCALA.PIU_PICCOLA;
                    hex.targetY = height * 0.5 + offsetYFromCenter * this.SCALA.PIU_PICCOLA;
                    hex.targetScale = this.SCALA.PIU_PICCOLA;
                }
            });

            const esagoniItalia = this.gestoreMappa.esagoni.filter(e => 
                e.regione !== this.gestoreMappa.regioneSelezionata
            );
            
            esagoniItalia.forEach(hex => {
                this.inizializzaPosizioniOriginali(hex);
                hex.targetX = hex.originalX * 0.3 + width * -0.25;
                hex.targetY = hex.originalY * 0.3 + height * 0.35;
                hex.targetScale = 0.3;
            });

            this.gestoreTesto.setCarceraRimpicciolito(false);
        }
    }

    animazioneRegione(d, esagono) {
        if (d.properties.reg_name === esagono.regione) {
            const currentTransform = d3.select(this).attr("transform") || "";
            const translateX = -window.innerWidth * 0.2;
            return `${currentTransform} translate(${translateX},0) scale(0.85)`;
        }
        return d.properties ? d.properties.transform || "" : "";
    }

    gestisciClickEsagono(esagono) {
        d3.selectAll(".regione")
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr("transform", (d) => this.animazioneRegione(d, esagono));
    }

    ripristinaVista() {
        d3.selectAll(".regione")
            .transition()
            .duration(800)
            .ease(d3.easeCubicInOut)
            .attr("transform", d => d.properties ? d.properties.transform || "" : "");
    }

    aggiornaIngrandimento() {
        if (this.inIngrandimento && this.esagonoIngrandito) {
            const tempoTrascorso = millis() - this.tempoInizioIngrandimento;
            const progresso = Math.min(tempoTrascorso / this.DURATA_INGRANDIMENTO, 1);
            const easeProgresso = this.easeInOutCubic(progresso);

            this.esagonoIngrandito.scaleMultiplier = lerp(
                this.esagonoIngrandito.scaleMultiplier,
                this.esagonoIngrandito.targetScale,
                easeProgresso
            );

            if (progresso >= 1) {
                this.inIngrandimento = false;
            }
        }
        
        if (this.inRiduzione && this.esagonoIngrandito) {
            const tempoTrascorso = millis() - this.tempoInizioRiduzione;
            const progresso = Math.min(tempoTrascorso / this.DURATA_INGRANDIMENTO, 1);
            const easeProgresso = this.easeInOutCubic(progresso);

            this.esagonoIngrandito.scaleMultiplier = lerp(
                this.esagonoIngrandito.scaleMultiplier,
                this.SCALA.NORMALE,
                easeProgresso
            );

            if (progresso >= 1) {
                this.inRiduzione = false;
            }
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
} 