const StatoMappa = {
    ITALIA: 'ITALIA',
    REGIONE: 'REGIONE',
    CELLA: 'CELLA'
};

class GestoreMappa {
    constructor() {
      this.esagoni = [];
      this.regioneHover = null;
      this.cellaHover = null;
      this.regioneSelezionata = null;
      this.italiaRimpicciolita = false;
      this.stato = StatoMappa.ITALIA;
      this.gestoreEsagoni = new GestoreEsagoni(this);
      this.gestoreTesto = new GestoreTesto(new GestoreAnimazioni());
      this.CONFIG = CONFIGURAZIONE;
      this.esagonoCliccato = null;
      this.hoverAttivo = true;
      this.fadeInProgress = 0;
            this._cache = {
          esagoniPerRegione: new Map(),
          centroRegioni: new Map(),
          dimensioniMappa: null
      };
    }
  
    caricaDati(tabella) {
      this._cache.dimensioniMappa = this._calcolaDimensioniMappa(tabella);
      const { minX, maxX, minY, maxY, scaleFactor, offsetX, offsetY, raggio } = this._cache.dimensioniMappa;

      const sovraffollamenti = tabella.getColumn('sovraffollamento').map(Number);
      const maxSovraffollamento = Math.max(...sovraffollamenti);
      const minSovraffollamento = Math.min(...sovraffollamenti);
      
      let contatoreRegioni = new Map();
      
      for (let riga of tabella.rows) {
          const esagono = this._creaEsagono(riga, {
              minX, maxX, minY, maxY, 
              offsetX, offsetY, 
              scaleFactor, raggio,
              minSovraffollamento, maxSovraffollamento,
              contatoreRegioni
          });
          
          this.esagoni.push(esagono);
          
          if (!this._cache.esagoniPerRegione.has(esagono.regione)) {
              this._cache.esagoniPerRegione.set(esagono.regione, []);
          }
          this._cache.esagoniPerRegione.get(esagono.regione).push(esagono);
      }

      this._calcolaCentriRegioni();
      
      this.gestoreTesto.setEsagoni(this.esagoni);
    }
  
    _calcolaDimensioniMappa(tabella) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      for (let riga of tabella.rows) {
        let x = parseFloat(riga.get('x').replace(',', '.'));
        let y = parseFloat(riga.get('y').replace(',', '.'));
        minX = min(minX, x);
        maxX = max(maxX, x);
        minY = min(minY, y);
        maxY = max(maxY, y);
      }
      
      let mappaWidth = maxX - minX;
      let mappaHeight = maxY - minY;
      let aspectRatio = mappaWidth / mappaHeight;
      
      let marginHeight = height * this.CONFIG.margini.verticale * 0.8;
      let scaleFactor = marginHeight / mappaHeight;
      let scaledWidth = marginHeight * aspectRatio;
      
      let offsetX = (width - scaledWidth) / 2;
      let offsetY = (height - marginHeight) / 2;
      
      let raggio = marginHeight / 45;

      return { minX, maxX, minY, maxY, scaleFactor, offsetX, offsetY, raggio };
    }
  
    _creaEsagono(riga, params) {
      const {
          minX, maxX, minY, maxY,
          offsetX, offsetY,
          scaleFactor, raggio,
          minSovraffollamento, maxSovraffollamento,
          contatoreRegioni
      } = params;

      let x = parseFloat(riga.get('x').replace(',', '.'));
      let y = parseFloat(riga.get('y').replace(',', '.'));
      let sovraffollamento = parseFloat(riga.get('sovraffollamento'));
      let regione = riga.get('regione');
      let carcere = riga.get('carcere');
      let persone = parseInt(riga.get('persone'));
      let spazio = parseFloat(riga.get('spazio').replace(',', '.'));
      let hexId = riga.get('hexagon_id');
      
      if (!contatoreRegioni.has(regione)) {
          contatoreRegioni.set(regione, 1);
      } else {
          contatoreRegioni.set(regione, contatoreRegioni.get(regione) + 1);
      }
      
      let mappedX = map(x, minX, maxX, offsetX, offsetX + scaleFactor * (maxX - minX));
      let mappedY = map(y, minY, maxY, offsetY, offsetY + scaleFactor * (maxY - minY));
      
      let colore = this.calcolaColore(sovraffollamento, minSovraffollamento, maxSovraffollamento);
      
      let esagono = new Esagono(mappedX, mappedY, raggio, regione, colore, contatoreRegioni.get(regione));
      esagono.sovraffollamento = sovraffollamento;
      esagono.carcere = carcere;
      esagono.persone = persone;
      esagono.spazio = spazio;
      esagono.id = hexId;
      return esagono;
    }
  
    _calcolaCentriRegioni() {
      for (let [regione, esagoni] of this._cache.esagoniPerRegione) {
          let sommaX = 0, sommaY = 0;
          esagoni.forEach(esagono => {
              sommaX += esagono.originalX;
              sommaY += esagono.originalY;
          });
          this._cache.centroRegioni.set(regione, {
              x: sommaX / esagoni.length,
              y: sommaY / esagoni.length
          });
      }
    }
  
    getEsagoniRegione(regione) {
      return this._cache.esagoniPerRegione.get(regione) || [];
    }
  
    getCentroRegione(regione) {
      return this._cache.centroRegioni.get(regione);
    }
  
    calcolaColore(sovraffollamento, min, max) {
        if (sovraffollamento <= 100) {
            return lerpColor(
                color(this.CONFIG.colori.esagonoBase),
                color(this.CONFIG.colori.esagonoMedio),
                map(sovraffollamento, 0, 100, 0, 1)
            );
        } else if (sovraffollamento <= 150) {
            return lerpColor(
                color(this.CONFIG.colori.esagonoMedio),
                color(this.CONFIG.colori.esagonoAlto),
                map(sovraffollamento, 100, 150, 0, 1)
            );
        } else {
            return color(this.CONFIG.colori.esagonoAlto);
        }
    }
  
    aggiorna() {
        if (this.fadeInProgress < 1) {
            this.fadeInProgress = min(this.fadeInProgress + 0.0083, 1);
        }

        let nuovaRegioneHover = null;
        let nuovaCellaHover = null;

        if (this.gestoreEsagoni.esagonoIngrandito) {
            nuovaCellaHover = this.trovaCellaHover();
        } else {
            nuovaRegioneHover = this.trovaRegioneHover();
        }

        if (nuovaRegioneHover !== this.regioneHover) {
            this.regioneHover = nuovaRegioneHover;
        }

        if (nuovaCellaHover !== this.cellaHover) {
            this.cellaHover = nuovaCellaHover;
        }

        for (let esagono of this.esagoni) {
            esagono.aggiorna();
            this.aggiornaStatoEsagono(esagono);
            if (esagono.scaleMultiplier !== esagono.targetScale) {
                esagono.scaleMultiplier = lerp(esagono.scaleMultiplier, esagono.targetScale, 0.1);
            }
        }

        this.gestoreTesto.aggiornaTesto(
            this.regioneSelezionata || this.regioneHover,
            this.esagonoCliccato || this.cellaHover || this.regioneHover
        );
    }
  
    trovaRegioneHover() {
      for (let esagono of this.esagoni) {
        let distanza = dist(mouseX, mouseY, esagono.x, esagono.y);
        if (distanza < esagono.raggio * 1.5) {
          return this.regioneSelezionata ? 
            (esagono.regione === this.regioneSelezionata ? esagono : null) : 
            esagono.regione;
        }
      }
      return null;
    }
  
    aggiornaStatoEsagono(esagono) {
        if (!this.hoverAttivo) {
            esagono.hoverState = 0;
            if (this.gestoreEsagoni.esagonoIngrandito === esagono) {
                esagono.opacita = 255 * this.fadeInProgress;
            } else {
                esagono.opacita = (this.regioneSelezionata === esagono.regione ? 255 : 30) * this.fadeInProgress;
            }
            return;
        }
  
        let targetHoverState = 0;
        if (this.regioneSelezionata) {
            targetHoverState = (this.regioneHover === esagono || this.esagonoCliccato === esagono) ? 1 : 0;
        } else {
            targetHoverState = esagono.regione === this.regioneHover ? 1 : 0;
        }
        esagono.hoverState = lerp(esagono.hoverState, targetHoverState, 0.2);
  
        let targetOpacita = 255;
        if (this.regioneSelezionata) {
            if (this.esagonoCliccato === esagono) {
                targetOpacita = 255;
            } else {
                targetOpacita = esagono.regione === this.regioneSelezionata ? 255 : 30;
            }
        } else if (this.regioneHover) {
            targetOpacita = esagono.regione === this.regioneHover ? 255 : 100;
        }
        esagono.opacita = lerp(esagono.opacita, targetOpacita * this.fadeInProgress, 0.1);
    }
  
    gestisciClick(mouseX, mouseY) {
        switch (this.stato) {
            case StatoMappa.ITALIA:
                this._gestisciClickItalia(mouseX, mouseY);
                break;
            case StatoMappa.REGIONE:
                this._gestisciClickRegione(mouseX, mouseY);
                break;
            case StatoMappa.CELLA:
                this._gestisciClickCella(mouseX, mouseY);
                break;
        }
    }

    _gestisciClickItalia(mouseX, mouseY) {
        for (let esagono of this.esagoni) {
            let distanza = dist(mouseX, mouseY, esagono.x, esagono.y);
            if (distanza < esagono.raggio * 1.5) {
                this._selezionaRegione(esagono);
                break;
            }
        }
    }

    _gestisciClickRegione(mouseX, mouseY) {
        let italiaCliccata = this.esagoni.some(esagono => {
            if (esagono.regione !== this.regioneSelezionata) {
                let distanza = dist(mouseX, mouseY, esagono.x, esagono.y);
                return distanza < esagono.raggio * esagono.scaleMultiplier * 1.5;
            }
            return false;
        });

        if (italiaCliccata) {
            this._tornaAllaVistaPrincipale();
            return;
        }

        for (let esagono of this.esagoni) {
            if (esagono.regione === this.regioneSelezionata) {
                let distanza = dist(mouseX, mouseY, esagono.x, esagono.y);
                let raggioEffettivo = esagono.raggio * esagono.scaleMultiplier;
                
                if (distanza < raggioEffettivo * 1.5) {
                    this.stato = StatoMappa.CELLA;
                    this.gestoreEsagoni.gestisciClickEsagonoRegione(esagono);
                    this.esagonoCliccato = null;
                    this.cellaHover = null;
                    this.gestoreTesto.resetStatoCompleto();
                    return;
                }
            }
        }
    }

    _gestisciClickCella(mouseX, mouseY) {
        if (this.gestoreEsagoni.esagonoIngrandito) {
            let regioneEsagoni = this.getEsagoniRegione(this.regioneSelezionata);
            
            for (let esagono of regioneEsagoni) {
                let distanza = dist(mouseX, mouseY, esagono.x, esagono.y);
                let raggioEffettivo = esagono.raggio * esagono.scaleMultiplier;
                
                if (distanza < raggioEffettivo * 1.5) {
                    this.stato = StatoMappa.REGIONE;
                    this.gestoreEsagoni.gestisciClickEsagonoRegione(this.gestoreEsagoni.esagonoIngrandito);
                    this.cellaHover = null;
                    this.gestoreTesto.resetStatoCompleto();
                    return;
                }
            }
        }
    }

    _selezionaRegione(esagono) {
        this.esagonoCliccato = null;
        this.cellaHover = null;
        this.regioneHover = null;
        this.gestoreTesto.resetStato();
        
        this.regioneSelezionata = esagono.regione;
        this.stato = StatoMappa.REGIONE;
        
        const descrizioneRegione = tabella.rows.find(row => 
            row.get('regione') === esagono.regione
        )?.get('descrizione');
        
        this.gestoreTesto.gestoreRegione.setRegioneCliccata(true, esagono.regione, descrizioneRegione);
        
        let regioneEsagoni = this.esagoni.filter(e => e.regione === this.regioneSelezionata);
        let centerX = regioneEsagoni.reduce((sum, h) => sum + h.originalX, 0) / regioneEsagoni.length;
        let centerY = regioneEsagoni.reduce((sum, h) => sum + h.originalY, 0) / regioneEsagoni.length;
        
        regioneEsagoni.forEach(hex => {
            let offsetX = hex.originalX - centerX;
            let offsetY = hex.originalY - centerY;
            hex.targetX = width * 0.5 + offsetX * 1.5;
            hex.targetY = height * 0.5 + offsetY * 1.5;
            hex.targetScale = 1.5;
        });
        
        this.esagoni.filter(e => e.regione !== this.regioneSelezionata).forEach(hex => {
            hex.targetX = hex.originalX * 0.3 + width * -0.01;
            hex.targetY = hex.originalY * 0.3 + height * 0.35;
            hex.targetScale = 0.3;
            hex.disattivaAnimazione();
        });
    }

    _tornaAllaVistaPrincipale() {
        this.esagoni.forEach(hex => {
            hex.targetX = hex.originalX;
            hex.targetY = hex.originalY;
            hex.targetScale = 1;
            hex.disattivaAnimazione();
        });
        this.regioneSelezionata = null;
        this.stato = StatoMappa.ITALIA;
        this.esagonoCliccato = null;
        this.cellaHover = null;
        this.regioneHover = null;
        this.gestoreTesto.resetStatoRegione();
    }

    disegna() {
        for (let esagono of this.esagoni) {
            if ((esagono.regione !== this.regioneHover && esagono !== this.cellaHover) || 
                !this.hoverAttivo) {
                esagono.disegna();
            }
        }

        for (let esagono of this.esagoni) {
            if ((esagono.regione === this.regioneHover || esagono === this.cellaHover) && 
                this.hoverAttivo) {
                esagono.disegna();
            }
        }

        this.gestoreTesto.disegna();
    }

    trovaCellaHover() {
        if (this.gestoreEsagoni.esagonoIngrandito) {
            return this.gestoreEsagoni.esagonoIngrandito;
        }

        if (!this.regioneSelezionata) {
            return null;
        }

        const regioneEsagoni = this.esagoni.filter(e => e.regione === this.regioneSelezionata);
        
        for (let esagono of regioneEsagoni) {
            let distanza = dist(mouseX, mouseY, esagono.x, esagono.y);
            let areaHover = esagono.scaleMultiplier > 1.5 ? 20.0 : 1.5;
            let raggioEffettivo = esagono.raggio * esagono.scaleMultiplier * areaHover;
            
            if (distanza < raggioEffettivo) {
                return esagono;
            }
        }
        return null;
    }
} 