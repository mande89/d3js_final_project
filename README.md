# Marvel Universe Project

# Fonti dei dati utilizzati:
- https://www.kaggle.com/dannielr/marvel-superheroes : dataset di riferimento dove ho estratto l'elenco dei personaggi, l'elenco di tutti i fumetti, l'elenco delle coppie   personaggio e il fumetto nel quale è presente, l'elenco delle informazioni dei vari personaggi di cui ho estratto solamente l'allineamento e il sesso (non era presente per la totalità dei personaggi);
- https://data.world/fivethirtyeight/comic-characters : dopo aver effettuato una semplice normalizzazione dei nomi dei personaggi, ho arricchito le informazioni del dataset precedente andando ad aggiungere l'allineamento ed il sesso per alcuni personaggi di cui non era presente;
(ci sono comunque un 40% circa di personaggi senza informazioni relative l'allineamento e il sesso) 
 
# Obiettivi dell'interfaccia:
- Selezionato un personaggio è possibile visualizzare la sua storia editoriale, cioè è possibile vedere come è variato il rapporto tra lui e gli altri personaggi dell'Universo Marvel nel tempo; 
- Selezionato un personaggio è possibile visualizzare il grafo dei personaggi con cui è entrato in contatto;
  
# Descrizione dell'interfaccia:
Nell'interfaccia è presente una navbar di navigazione principale dove è possibile inserire il nome del personaggio che si vuole analizzare, ed è possibile navigare tra le 2 varie sezioni possibili:
- Una prima sezione rappresenta l'evoluzione temporale del personaggio, tramite un grafico circolare suddiviso in base ai vari anni di pubblicazione, la grandezza è proporzionale al numero di volte che il personaggio principale entra in contatto con i vari personaggi di quell'anno. I personaggi sono divisi in Buoni, Cattivi, Neutrali e NonDefiniti. Sono presenti più livelli di approfondimento: anno, allineamento, genere, e come livello finale i singoli personaggi. Si può navigare il grafico andando a cliccare la specifica sezione che si vuole approfondire e per tornare al livello precende basta un click al centro del grafico. Un ulteriore semplice grafico a linee è presente per mostrare all'utente in modo immediato l'anno in cui il personaggio selezionato ha maggiori interazioni uniche con i personaggi (cioè anche se un personaggio dovesse interagire più volte con il nostro personaggio principale conterebbe comunque come 1, cosa invece diversa nel primo grafico dove vengono conteggiate le totalità di interazioni);
- Una seconda sezione che rappresenta che il grafo sociale del personaggio scelto, più il nodo di un personaggio è grande e più volte interagisce con il personaggio principale, inoltre più l'arco che collega 2 nodi è spesso e più volte i 2 personaggi interagiscono tra loro. Cliccando su un nodo vengono aggiunte, nella tabella vicino il grafo, alcune informazioni di quel nodo quali: nome, sesso, allineamento e il numero di volte che interagisce con il personaggio principale. Si può cambiare la dimensione del grafo sociale per aumentare o diminuire il numero di nodi presenti, le dimensioni possibili sono: piccolo, medio, grande e grafo completo.



