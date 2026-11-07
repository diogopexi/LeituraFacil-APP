<template>
  <main class="info-page section-shell">
    <section class="info-hero">
      <span class="eyebrow">RECURSOS</span>
      <h1>Recursos pensados para uma leitura mais confortável.</h1>
      <p>Conheça as escolhas de acessibilidade que fazem parte da proposta do Leitura Fácil.</p>
    </section>

    <section class="resource-cards">
      <article class="showcase-card resource-card"><span class="mini-title">PALETA DE CORES</span><h2>Cores suaves e contrastes confortáveis</h2><p>Uma combinação de cores claras e tons de destaque ajuda a criar uma interface acolhedora sem perder a legibilidade.</p><div class="palette-grid"><span v-for="c in ['#163A8A','#3282E6','#4CAF78','#BFE3EA','#FAF8F2','#EDE2CC','#E6E6FA','#F2F4F7','#647488','#1F2937']" :key="c" :style="{ background: c }"><small>{{ c }}</small></span></div></article>
      <article class="showcase-card resource-card"><span class="mini-title">TIPOGRAFIA SUGERIDA</span><h2>Fontes pensadas para facilitar a leitura</h2><p>Usamos uma combinação de títulos com presença visual e fontes de leitura como <strong>OpenDyslexic / Inter</strong>, com possibilidade de adaptação.</p><div class="font-demo"><div><small>Títulos / Destaques</small><strong>Poppins SemiBold<br>AaBbCc 123</strong></div><div><small>Textos / Leitura</small><strong>OpenDyslexic / Inter<br>AaBbCc 123</strong></div></div></article>
    </section>

    <section class="purpose-section"><span class="eyebrow">NOSSO OBJETIVO</span><h2>A leitura não deve ser um desafio.</h2><p>A informação deve ser para todos.</p><div class="access-points resource-points"><span>◉ <b>Fontes legíveis</b><small>e adaptáveis</small></span><span>◉ <b>Espaços e contrastes</b><small>confortáveis</small></span><span>♡ <b>Interface limpa</b><small>e sem distrações</small></span><span>↗ <b>Navegação</b><small>simples e clara</small></span><span>▣ <b>Funciona bem</b><small>em todos os dispositivos</small></span></div></section>
  </main>
</template>
