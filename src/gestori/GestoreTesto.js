class GestoreTestoBase {
    constructor(gestoreAnimazioni) {
        this.gestoreAnimazioni = gestoreAnimazioni;
        this.stato = {
            testo: "",
            precedente: null,
            inCancellazione: false,
            ultimaCancellazione: 0
        };
        this.testoCorrente = "";
        this.velocitaCancellazione = 2;
    }

    reset() {
        this.stato.inCancellazione = true;
        this.stato.ultimaCancellazione = millis();
    }

    cancellaTesto() {
        if (this.stato.inCancellazione) {
            let tempoCorrente = millis();
            if (tempoCorrente - this.stato.ultimaCancellazione > this.velocitaCancellazione) {
                this.testoCorrente = this.testoCorrente.slice(0, -3);
                if (this.testoCorrente.length === 0) {
                    this.stato.testo = "";
                    this.stato.precedente = null;
                    this.stato.inCancellazione = false;
                }
                this.stato.ultimaCancellazione = tempoCorrente;
            }
        }
        return this.testoCorrente;
    }

    aggiornaTesto(testoNuovo) {
        if (testoNuovo === "") {
            this.stato.inCancellazione = true;
            return this.cancellaTesto();
        }

        if (this.stato.inCancellazione) {
            return this.cancellaTesto();
        }

        this.testoCorrente = this.gestoreAnimazioni.animaTesto(this.testoCorrente, testoNuovo);
        return this.testoCorrente;
    }
}

class GestoreTestoRegione extends GestoreTestoBase {
    constructor(gestoreAnimazioni) {
        super(gestoreAnimazioni);
        this.testoCompletato = false;
        this.nuovaRegione = null;
        this.regioneCliccata = false;
        this.descrizione = "";
        this.testoFormattato = [];
        this.indiceCarattereCorrente = 0;
        this.attesaCompletata = false;
    }

    formattaTesto(testo, maxWidth) {
        if (!testo) return [];
        const [titolo, ...descrizione] = testo.split('\n');
        const righe = [titolo];
        
        if (descrizione.length > 0) {
            const testoDescrizione = descrizione.join(' ');
            const parole = testoDescrizione.split(' ');
            let rigaCorrente = '';

            for (let parola of parole) {
                const testRiga = rigaCorrente + (rigaCorrente ? ' ' : '') + parola;
                textSize(16);
                if (textWidth(testRiga) <= maxWidth) {
                    rigaCorrente = testRiga;
                } else {
                    if (rigaCorrente) righe.push(rigaCorrente);
                    rigaCorrente = parola;
                }
            }
            if (rigaCorrente) righe.push(rigaCorrente);
        }
        return righe;
    }

    aggiorna(regioneSelezionata) {
        if (!regioneSelezionata) {
            this.testoCompletato = false;
            this.nuovaRegione = null;
            this.regioneCliccata = false;
            this.descrizione = "";
            this.testoFormattato = [];
            this.indiceCarattereCorrente = 0;
            return this.aggiornaTesto("");
        }

        if (this.regioneCliccata) {
            const testoCompleto = regioneSelezionata + "\n" + this.descrizione;
            this.testoFormattato = this.formattaTesto(testoCompleto, width * 0.2);
            
            const totaleCaratteri = this.testoFormattato.join('\n').length;
            
            if (this.indiceCarattereCorrente < totaleCaratteri) {
                this.indiceCarattereCorrente++;
                let caratteriRimanenti = this.indiceCarattereCorrente;
                let testoCorrente = [];
                
                for (let riga of this.testoFormattato) {
                    if (caratteriRimanenti <= 0) break;
                    if (caratteriRimanenti >= riga.length) {
                        testoCorrente.push(riga);
                        caratteriRimanenti -= riga.length + 1;
                    } else {
                        testoCorrente.push(riga.substring(0, caratteriRimanenti));
                        caratteriRimanenti = 0;
                    }
                }
                
                this.testoCorrente = testoCorrente.join('\n');
            } else {
                this.testoCorrente = this.testoFormattato.join('\n');
                this.testoCompletato = true;
            }
            
            return this.testoCorrente;
        }

        if (regioneSelezionata !== this.stato.precedente && this.testoCorrente !== "") {
            this.stato.inCancellazione = true;
            this.nuovaRegione = regioneSelezionata;
            return this.cancellaTesto();
        }

        if (this.stato.inCancellazione) {
            const testoCanc = this.cancellaTesto();
            if (testoCanc === "" && this.nuovaRegione) {
                this.stato.precedente = this.nuovaRegione;
                this.stato.testo = this.nuovaRegione;
                this.testoCompletato = false;
                this.nuovaRegione = null;
            }
            return testoCanc;
        }

        if (regioneSelezionata !== this.stato.precedente) {
            this.stato.precedente = regioneSelezionata;
            this.stato.testo = regioneSelezionata;
            this.testoCompletato = false;
        }

        if (this.testoCompletato) {
            return this.stato.testo;
        }

        this.testoCorrente = this.aggiornaTesto(this.stato.testo);
        
        if (this.testoCorrente === this.stato.testo) {
            this.testoCompletato = true;
        }

        return this.testoCorrente;
    }

    setRegioneCliccata(clicked, regione, descrizione) {
        this.regioneCliccata = clicked;
        if (clicked) {
            this.testoCorrente = "";
            this.testoCompletato = false;
            this.descrizione = descrizione || "";
            this.indiceCarattereCorrente = 0;
        }
    }

    reset() {
        super.reset();
        this.testoCompletato = false;
        this.nuovaRegione = null;
        this.regioneCliccata = false;
        this.descrizione = "";
        this.testoFormattato = [];
        this.indiceCarattereCorrente = 0;
    }
}
class GestoreTestoCarcere extends GestoreTestoBase {
    constructor(gestoreAnimazioni, datiCarceri) {
        super(gestoreAnimazioni);
        this.datiCarceri = datiCarceri;
        this.esagonoCliccato = null;
        this.ultimoEsagonoSelezionato = null;
        this.nuovoTestoInAttesa = null;
        this.testoCompletato = false;
        this.indiceCarattereCorrente = 0;
    }

    aggiorna(regioneSelezionata, esagonoSelezionato) {
        if (!regioneSelezionata || !esagonoSelezionato) {
            this.esagonoCliccato = null;
            this.ultimoEsagonoSelezionato = null;
            this.nuovoTestoInAttesa = null;
            this.testoCompletato = false;
            this.indiceCarattereCorrente = 0;
            return this.aggiornaTesto("");
        }

        if (esagonoSelezionato?.scaleMultiplier > 1.5) {
            if (!this.esagonoCliccato) {
                const regioneNormalizzata = regioneSelezionata.replace(/ /g, '_').replace(/'/g, '_');
                const hexId = `${regioneNormalizzata}_hex_${esagonoSelezionato.id}`;
                const datiCarcere = this.datiCarceri.get(hexId);
                this.stato.testo = datiCarcere ? datiCarcere.carcere : "";
                this.esagonoCliccato = esagonoSelezionato;
                this.testoCompletato = false;
                this.indiceCarattereCorrente = 0;
            }

            if (!this.testoCompletato) {
                if (this.indiceCarattereCorrente < this.stato.testo.length) {
                    this.indiceCarattereCorrente++;
                    this.testoCorrente = this.stato.testo.substring(0, this.indiceCarattereCorrente);
                } else {
                    this.testoCompletato = true;
                }
            }
            
            return this.testoCompletato ? this.stato.testo : this.testoCorrente;
        }

        if (this.esagonoCliccato) {
            this.esagonoCliccato = null;
            this.ultimoEsagonoSelezionato = null;
            this.nuovoTestoInAttesa = null;
            this.testoCompletato = false;
            this.indiceCarattereCorrente = 0;
            return this.aggiornaTesto("");
        }

        if (!this.esagonoCliccato && esagonoSelezionato?.scaleMultiplier <= 1.5) {
            const regioneNormalizzata = regioneSelezionata.replace(/ /g, '_').replace(/'/g, '_');
            const hexId = `${regioneNormalizzata}_hex_${esagonoSelezionato.id}`;
            const datiCarcere = this.datiCarceri.get(hexId);
            const nuovoTesto = datiCarcere ? datiCarcere.carcere : "";

            if (nuovoTesto !== this.stato.testo) {
                if (this.testoCorrente !== "") {
                    this.stato.inCancellazione = true;
                    this.nuovoTestoInAttesa = nuovoTesto;
                    return this.cancellaTesto();
                }
                this.stato.testo = nuovoTesto;
                this.testoCompletato = false;
                this.indiceCarattereCorrente = 0;
            }

            if (!this.testoCompletato) {
                if (this.indiceCarattereCorrente < this.stato.testo.length) {
                    this.indiceCarattereCorrente++;
                    this.testoCorrente = this.stato.testo.substring(0, this.indiceCarattereCorrente);
                    return this.testoCorrente;
                } else {
                    this.testoCompletato = true;
                }
            }
        }

        return this.testoCompletato ? this.stato.testo : this.testoCorrente;
    }

    reset() {
        super.reset();
        this.testoCompletato = false;
        this.indiceCarattereCorrente = 0;
        this.esagonoCliccato = null;
        this.ultimoEsagonoSelezionato = null;
        this.nuovoTestoInAttesa = null;
    }
}

class GestoreTestoSovraffollamento extends GestoreTestoBase {
    constructor(gestoreAnimazioni, datiCarceri) {
        super(gestoreAnimazioni);
        this.datiCarceri = datiCarceri;
        this.percentuale = 0;
        this.persone = 0;
        this.spazio = 0;
        this.esagonoCliccato = null;
        
        this.TESTI = {
            TASSO_AFFOLLAMENTO: "Tasso di affollamento:",
            PERSONE_STANZA: "Persone per stanza:",
            SPAZIO_PERSONA: "Spazio per persona:",
            UNITA_PERCENTUALE: "%",
            UNITA_SPAZIO: "m²"
        };
    }

    formattaTesto(datiCarcere) {
        const tasso = parseFloat(datiCarcere.sovraffollamento) || 0;
        const persone = parseInt(datiCarcere.persone) || 0;
        const spazio = parseFloat(datiCarcere.spazio) || 0;
        
        return [
            this.TESTI.TASSO_AFFOLLAMENTO,
            `${tasso}${this.TESTI.UNITA_PERCENTUALE}`,
            this.TESTI.SPAZIO_PERSONA,
            `${spazio} ${this.TESTI.UNITA_SPAZIO}`,
            this.TESTI.PERSONE_STANZA,
            `${persone}`
        ].join('\n');
    }

    aggiorna(regioneSelezionata, esagonoSelezionato) {
        if (esagonoSelezionato?.scaleMultiplier > 1.5) {
            this.esagonoCliccato = esagonoSelezionato;
        }
        
        if (!regioneSelezionata || !this.esagonoCliccato) {
            if (this.stato.testo !== "") {
                this.stato.inCancellazione = true;
            }
            return this.aggiornaTesto("");
        }

        if (this.esagonoCliccato?.scaleMultiplier <= 1.5) {
            this.esagonoCliccato = null;
            return this.aggiornaTesto("");
        }

        const hexId = `${regioneSelezionata.replace(/ /g, '_').replace(/'/g, '_')}_hex_${this.esagonoCliccato.id}`;
        const datiCarcere = this.datiCarceri.get(hexId);

        if (this.esagonoCliccato !== this.stato.precedente && datiCarcere) {
            this.stato.precedente = this.esagonoCliccato;
            this.percentuale = parseFloat(datiCarcere.sovraffollamento) || 0;
            this.persone = parseInt(datiCarcere.persone) || 0;
            this.spazio = parseFloat(datiCarcere.spazio) || 0;
            this.stato.testo = this.formattaTesto(datiCarcere);
            this.testoCorrente = "";
        }

        return this.aggiornaTesto(this.stato.testo);
    }

    reset() {
        super.reset();
        this.esagonoCliccato = null;
    }

    getPercentuale() {
        return this.percentuale;
    }

    getPersone() {
        return this.persone;
    }

    getSpazio() {
        return this.spazio;
    }
}

class GestoreTesto {
    constructor(gestoreAnimazioni) {
        this.gestoreAnimazioni = gestoreAnimazioni;
        this.stato = {
            regione: {
                testo: "",
                precedente: null,
                cliccata: false,
                inCancellazione: false,
                ultimaCancellazione: 0
            },
            carcere: {
                testo: "",
                precedente: null,
                cliccato: false,
                ingrandito: false,
                inCancellazione: false,
                ultimaCancellazione: 0
            },
            sovraffollamento: {
                testo: "",
                precedente: null,
                inCancellazione: false,
                ultimaCancellazione: 0
            }
        };
        this.datiCarceri = new Map();
        this.esagoni = null;
        this.font = null;
        this.regioneSelezionata = null;
        this.esagonoSelezionato = null;
        
        this.gestoreRegione = new GestoreTestoRegione(gestoreAnimazioni);
        this.gestoreCarcere = new GestoreTestoCarcere(gestoreAnimazioni, this.datiCarceri);
        this.gestoreSovraffollamento = new GestoreTestoSovraffollamento(gestoreAnimazioni, this.datiCarceri);
        
        this.inizializza();
    }

    async inizializza() {
        await this.caricaFont();
    }

    async caricaFont() {
        try {
            this.font = await new Promise((resolve, reject) => {
                loadFont('FONT/AeionMono-SemiBold.ttf', 
                    font => resolve(font),
                    err => reject(err)
                );
            });
            console.log('Font caricato con successo');
        } catch (error) {
            console.error('Errore nel caricamento del font:', error);
        }
    }

    setEsagoni(esagoni) {
        this.esagoni = esagoni;
        this.datiCarceri.clear();
        for (let esagono of esagoni) {
            const regioneNormalizzata = esagono.regione.replace(/ /g, '_').replace(/'/g, '_');
            const chiave = `${regioneNormalizzata}_hex_${esagono.id}`;
            this.datiCarceri.set(chiave, {
                carcere: esagono.carcere || "",
                regione: esagono.regione,
                x: esagono.x,
                y: esagono.y,
                sovraffollamento: esagono.sovraffollamento,
                persone: esagono.persone,
                spazio: esagono.spazio,
                hexId: chiave
            });
        }
    }

    resetStato() {
        this.gestoreRegione.reset();
        this.gestoreCarcere.reset();
        this.gestoreSovraffollamento.reset();
    }

    resetStatoRegione() {
        this.stato.regione.inCancellazione = true;
        this.stato.regione.ultimaCancellazione = millis();
    }

    resetStatoCompleto() {
        this.stato.regione.inCancellazione = true;
        this.stato.regione.ultimaCancellazione = millis();
        this.stato.carcere.inCancellazione = true;
        this.stato.carcere.ultimaCancellazione = millis();
        this.stato.sovraffollamento.inCancellazione = true;
        this.stato.sovraffollamento.ultimaCancellazione = millis();
    }

    aggiornaTesto(regioneSelezionata, esagonoSelezionato) {
        this.regioneSelezionata = regioneSelezionata;
        this.esagonoSelezionato = esagonoSelezionato;

        return {
            regione: this.gestoreRegione.aggiorna(regioneSelezionata),
            carcere: this.gestoreCarcere.aggiorna(regioneSelezionata, esagonoSelezionato),
            sovraffollamento: this.gestoreSovraffollamento.aggiorna(regioneSelezionata, esagonoSelezionato),
            percentualeSovraffollamento: this.gestoreSovraffollamento.getPercentuale(),
            persone: this.gestoreSovraffollamento.getPersone(),
            spazio: this.gestoreSovraffollamento.getSpazio()
        };
    }

    wrapText(testo, maxWidth) {
        const parole = testo.split(' ');
        const righe = [];
        let rigaCorrente = '';

        for (let parola of parole) {
            const testRiga = rigaCorrente + (rigaCorrente ? ' ' : '') + parola;
            textSize(16); // Impostiamo la dimensione del testo per il calcolo della larghezza
            if (textWidth(testRiga) <= maxWidth) {
                rigaCorrente = testRiga;
            } else {
                if (rigaCorrente) righe.push(rigaCorrente);
                rigaCorrente = parola;
            }
        }
        if (rigaCorrente) righe.push(rigaCorrente);
        return righe;
    }

    disegna() {
        if (!this.font) return;

        const testi = this.aggiornaTesto(this.regioneSelezionata, this.esagonoSelezionato);

        push();
        textFont(this.font);
        textAlign(LEFT, CENTER);
        
        const xPos = width * 0.75;
        const maxWidth = width * 0.2;
        const SPAZIO_CARCERE = 40;
        const SPAZIO_SOVRAFFOLLAMENTO = 80;
        const SPAZIO_PRIMA_CARCERE = 60;
        
        let altezzaTotale = 0;
        if (testi.regione) {
            const [nomeRegione, ...descrizione] = testi.regione.split('\n');
            textSize(32);
            altezzaTotale += 40;
            
            if (descrizione.length > 0) {
                const testoDescrizione = descrizione.join(' ');
                const righeDescrizione = this.wrapText(testoDescrizione, maxWidth);
                altezzaTotale += righeDescrizione.length * 25;
            }
        }

        altezzaTotale += SPAZIO_PRIMA_CARCERE + SPAZIO_CARCERE;

        if (testi.sovraffollamento) {
            const lines = testi.sovraffollamento.split('\n');
            altezzaTotale += (lines.length / 2) * SPAZIO_SOVRAFFOLLAMENTO;
        }
        
        let yPos = (height - altezzaTotale) / 2;
        
        if (testi.regione) {
            const [nomeRegione, ...descrizione] = testi.regione.split('\n');
            
            textSize(32);
            fill(255);
            text(nomeRegione, xPos, yPos);
            yPos += 40;
            
            if (descrizione.length > 0) {
                const testoDescrizione = descrizione.join(' ');
                const righeDescrizione = this.wrapText(testoDescrizione, maxWidth);
                
                textSize(16);
                fill(200);
                for (let riga of righeDescrizione) {
                    text(riga, xPos, yPos);
                    yPos += 25;
                }
            }
        }
        
        yPos += SPAZIO_PRIMA_CARCERE;
        
        if (testi.carcere) {
            textSize(24);
            fill(200);
            text(testi.carcere, xPos, yPos);
        }
        yPos += SPAZIO_CARCERE;
        
        if (testi.sovraffollamento) {
            const lines = testi.sovraffollamento.split('\n');
            const percentuale = testi.percentualeSovraffollamento;
            
            let colore;
            if (percentuale <= 100) {
                colore = lerpColor(
                    color(CONFIGURAZIONE.colori.esagonoBase),
                    color(CONFIGURAZIONE.colori.esagonoMedio),
                    map(percentuale, 0, 100, 0, 1)
                );
            } else if (percentuale <= 150) {
                colore = lerpColor(
                    color(CONFIGURAZIONE.colori.esagonoMedio),
                    color(CONFIGURAZIONE.colori.esagonoAlto),
                    map(percentuale, 100, 150, 0, 1)
                );
            } else {
                colore = color(CONFIGURAZIONE.colori.esagonoAlto);
            }

            for (let i = 0; i < lines.length; i += 2) {
                textSize(20);
                fill(150);
                text(lines[i], xPos, yPos);
                
                if (lines[i + 1]) {
                    textSize(48);
                    fill(colore);
                    text(lines[i + 1], xPos, yPos + 40);
                }
                
                yPos += SPAZIO_SOVRAFFOLLAMENTO;
            }
        }
        
        pop();
    }
} 