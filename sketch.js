let gestoreMappa;
let gestoreSvg;
let gestoreAnimazioni;
let gestoreIntro;
let legenda;
let tabella;
let fontLegenda;
let fontTitolo;
let caricamentoDatiCompletato = false;
let opacitaTitolo = 0;
let testoInfoCorrente = "";
let ultimoAggiornamentoInfo = 0;
let opacitaInfo = 255;
let infoCancellazione = false;
let infoCliccato = false;
let mostraCrediti = false;
let indiceTesto = 0;
const VELOCITA_INFO = 0.1;
const VELOCITA_CREDITI = 0.1;
const TESTO_CREDITI = "Dati elaborati a partire dalle Schede di Trasparenza degli Istituiti Penitenziari del Ministero della Giustizia ×";

function preload() {
  try {
    tabella = loadTable('datasetcarceri.csv', 'csv', 'header');
    fontLegenda = loadFont('FONT/AeionMono-SemiBold.ttf');
    fontTitolo = loadFont('FONT/AeionMono-Bold.ttf');
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
    console.error('Dettagli errore:', {
      message: error.message,
      stack: error.stack,
      path: window.location.href
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  inizializzaGestori();
  legenda = new Legenda(fontLegenda);
}

function inizializzaGestori() {
  try {
    gestoreAnimazioni = new GestoreAnimazioni();
    gestoreIntro = new GestoreIntro(gestoreAnimazioni);
    legenda = new Legenda(fontLegenda);
    gestoreMappa = new GestoreMappa(gestoreAnimazioni, legenda);
    if (tabella) {
      gestoreMappa.caricaDati(tabella);
      caricamentoDatiCompletato = true;
    }
    gestoreSvg = new GestoreSvg();
  } catch (error) {
    console.error('Errore nell\'inizializzazione dei gestori:', error);
    caricamentoDatiCompletato = false;
  }
}

function draw() {
  if (!caricamentoDatiCompletato) return;
  
  background(CONFIGURAZIONE.colori.sfondo);
  
  if (!gestoreIntro.attivo) {
    opacitaTitolo = lerp(opacitaTitolo, 255, 0.1);
  } else {
    opacitaTitolo = lerp(opacitaTitolo, 0, 0.1);
  }
  
  disegnaTitolo();
  aggiornaInfo();
  disegnaInfo();
  
  if (gestoreIntro.attivo) {
    gestoreIntro.aggiorna();
    gestoreIntro.disegna();
  } else {
    gestoreMappa?.aggiorna();
    gestoreMappa?.disegna();
    
    const esagonoIngrandito = gestoreMappa?.gestoreEsagoni?.esagonoIngrandito;
    if (esagonoIngrandito) {
      gestoreSvg?.visualizza(esagonoIngrandito);
      gestoreMappa?.gestoreEsagoni?.aggiornaIngrandimento();
    }
    
    legenda.disegna();
  }
}

function disegnaTitolo() {
  push();
  textFont(fontTitolo);
  textAlign(CENTER, TOP);
  fill(255, opacitaTitolo);
  textSize(32);
  text("Chiusi Dentro", width/2, height / 25);
  textSize(26);
  text("il sovraffollamento delle carceri Italiane", width/2, height / 12);
  pop();
}


function aggiornaInfo() {
  let tempoCorrente = millis();
  if (tempoCorrente - ultimoAggiornamentoInfo > VELOCITA_INFO) {
    if (!infoCliccato) {
      if (testoInfoCorrente.length < "Dati".length) {
        testoInfoCorrente += "Dati".charAt(testoInfoCorrente.length);
        ultimoAggiornamentoInfo = tempoCorrente;
      }
    } else if (mostraCrediti && !infoCancellazione) {
      if (indiceTesto < TESTO_CREDITI.length) {
        testoInfoCorrente = TESTO_CREDITI.substring(0, indiceTesto + 1);
        indiceTesto++;
        ultimoAggiornamentoInfo = tempoCorrente;
      }
    } else if (infoCancellazione) {
      if (testoInfoCorrente.length > 0) {
        testoInfoCorrente = testoInfoCorrente.substring(0, testoInfoCorrente.length - 1);
        ultimoAggiornamentoInfo = tempoCorrente;
      } else {
        infoCancellazione = false;
        mostraCrediti = false;
        infoCliccato = false;
        testoInfoCorrente = "";
      }
    }
  }
}

function disegnaInfo() {
  push();
  textFont(fontTitolo);
  textSize(mostraCrediti ? 12 : 14);
  textAlign(RIGHT, BOTTOM);
  
  let larghezzaTotale = textWidth(TESTO_CREDITI);
  let larghezzaSenzaX = textWidth(TESTO_CREDITI.slice(0, -2));
  let xPos = width - 20 - (larghezzaTotale - larghezzaSenzaX);
  let xPosMedia = (width - 15 + xPos) / 2;
  
  let testoSenzaX = TESTO_CREDITI.slice(0, -2);
  let larghezzaTestoSenzaX = textWidth(testoSenzaX);
  
  let mouseOverInfo = !mostraCrediti && mouseX > width - 60 && mouseX < width - 20 &&
                       mouseY > height - 40 && mouseY < height - 10;
  
  let mouseOverX = mostraCrediti && 
                   mouseX > xPosMedia - 10 && mouseX < xPosMedia + 10 &&
                   mouseY > height - 30 && mouseY < height - 10;
                   
  let mouseOverTesto = mostraCrediti &&
                       mouseX > width - 20 - larghezzaTestoSenzaX && 
                       mouseX < xPosMedia - 15 &&
                       mouseY > height - 30 && mouseY < height - 10;
  
  if (mouseOverTesto) {
    cursor(HAND);
  } else if (!mouseOverX) {
    cursor(AUTO);
  }
  
  let targetOpacita = (mouseOverInfo || mouseOverX || mouseOverTesto) ? 180 : 255;
  opacitaInfo = lerp(opacitaInfo, targetOpacita, 0.1);
  
  fill(255, opacitaInfo);
  text(testoInfoCorrente, width - 20, height - 20);
  
  if (!mostraCrediti) {
    let larghezzaTesto = textWidth(testoInfoCorrente);
    stroke(255, opacitaInfo);
    strokeWeight(1);
    line(width - 20 - larghezzaTesto, height - 17, width - 20, height - 17);
  }
  
  pop();
  
  window.xPosition = xPosMedia;
  window.testoArea = {
    x: width - 20 - larghezzaTestoSenzaX,
    width: larghezzaTestoSenzaX - 25
  };
}

function mousePressed() {
  if (gestoreIntro.attivo) {
    if (gestoreIntro.gestisciClick()) {
      return;
    }
  }
  
  if (mostraCrediti && 
      mouseX > window.testoArea.x && mouseX < window.testoArea.x + window.testoArea.width &&
      mouseY > height - 30 && mouseY < height - 10) {
    window.open('https://www.giustizia.it/giustizia/page/it/istituti_penitenziari#', '_blank');
    return;
  }
  
  if (mostraCrediti && 
      mouseX > window.xPosition - 10 && mouseX < window.xPosition + 10 &&
      mouseY > height - 30 && mouseY < height - 10) {
    infoCancellazione = true;
    return;
  }
  
  let mouseOverInfo = mouseX > width - 60 && mouseX < width - 20 &&
                      mouseY > height - 40 && mouseY < height - 10;
  if (mouseOverInfo && testoInfoCorrente === "Dati") {
    infoCliccato = true;
    mostraCrediti = true;
    indiceTesto = 0;
    testoInfoCorrente = "";
    return;
  }
  
  gestoreMappa?.gestisciClick(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gestoreMappa) {
    gestoreMappa.ridimensiona(windowWidth, windowHeight);
  }
  if (gestoreSvg) {
    gestoreSvg.ridimensiona(windowWidth, windowHeight);
  }
}

function disegnaEsagonoNero(esagono) {
  push();
  fill(0);
  esagono.disegna();
  pop();
}