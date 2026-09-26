<div align="center">

  <h1>NOVA_WEB</h1>

  <p>
    Frontend Angular de NOVA, plateforme de santé intelligente qui centralise l'accès à des informations médicales personnalisées.
  </p>

<p>
  <img src="https://img.shields.io/github/last-commit/BaditSad/NOVA_WEB" alt="last update" />
  <img src="https://img.shields.io/github/languages/top/BaditSad/NOVA_WEB" alt="top language" />
  <img src="https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white" alt="angular" />
</p>

</div>

<br />

## Table des matières

- [À propos](#à-propos)
  * [Stack technique](#stack-technique)
  * [Fonctionnalités](#fonctionnalités)
  * [Variables d'environnement](#variables-denvironnement)
- [Démarrage](#démarrage)
  * [Prérequis](#prérequis)
  * [Installation](#installation)
  * [Lancer en local](#lancer-en-local)
  * [Avec Docker](#avec-docker)
- [Dépôts liés](#dépôts-liés)
- [Contact](#contact)

## À propos

NOVA_WEB est l'interface utilisateur de NOVA : une plateforme qui rassemble plusieurs outils de santé pilotés par IA pour aider chacun à mieux comprendre et suivre son bien-être physique et mental, avec une analyse adaptée au profil et au pays de l'utilisateur.

L'application couvre trois grands usages :

- des questionnaires psychologiques validés (burnout, DASS-21, GAD-7, ISI, PHQ-9) avec un module de prédiction (smartpred)
- un module de check-up dermatologique (scan-body) avec segmentation d'image, carte de chaleur des lésions, score de risque, historique et conseils de triage
- un module de reconnaissance de médicaments (scan-med)

Elle inclut aussi la gestion de compte, l'authentification, un abonnement payant (pages de succès et d'annulation), de la documentation produit et une roadmap publique.

### Stack technique

<details>
  <summary>Frontend</summary>
  <ul>
    <li><a href="https://angular.dev/">Angular 19</a></li>
    <li><a href="https://www.typescriptlang.org/">TypeScript</a></li>
    <li><a href="https://tailwindcss.com/">Tailwind CSS 4</a> + <a href="https://daisyui.com/">DaisyUI</a> / <a href="https://flyonui.com/">FlyonUI</a></li>
    <li><a href="https://www.chartjs.org/">Chart.js</a> pour les graphiques de suivi</li>
    <li><a href="https://spline.design/">Spline</a> pour les visuels 3D</li>
    <li><a href="https://github.com/matteobruni/tsparticles">tsParticles</a>, <a href="https://airbnb.io/lottie/">Lottie</a>, <a href="https://michalsnik.github.io/aos/">AOS</a> pour les animations</li>
    <li><a href="https://github.com/parallax/jsPDF">jsPDF</a> pour l'export des résultats en PDF</li>
  </ul>
</details>

<details>
  <summary>Déploiement</summary>
  <ul>
    <li><a href="https://www.docker.com/">Docker</a></li>
  </ul>
</details>

### Fonctionnalités

- Questionnaires psychologiques (burnout, DASS-21, GAD-7, ISI, PHQ-9) avec module de prédiction
- Check-up dermatologique assisté par IA : segmentation de lésion, carte de chaleur, score de risque, historique, conseils de triage
- Reconnaissance de médicaments par photo
- Compte utilisateur, authentification et page protégée par mot de passe de site
- Abonnement payant avec pages de confirmation et d'annulation
- Documentation intégrée et roadmap produit

### Variables d'environnement

Configurées dans `src/environments/environment.ts` (dev) et `environment.prod.ts` (prod), notamment :

`apiUrl` : URL de l'API NOVA_API consommée par le frontend

`features.enableTTA`, `features.enableCamera`, `features.enableHistory` : bascules de fonctionnalités

`features.maxImageSize`, `features.supportedFormats` : contraintes d'upload d'image pour le scan

## Démarrage

### Prérequis

Node.js et Angular CLI.

```bash
npm install -g @angular/cli
```

### Installation

```bash
npm install
```

### Lancer en local

```bash
ng serve
```

Ouvrir `http://localhost:4200/`.

### Avec Docker

```bash
docker build -t nova-web .
docker run -p 4200:4200 nova-web
```

## Dépôts liés

NOVA_WEB fait partie de la suite de dépôts NOVA :

- [NOVA_API](https://github.com/BaditSad/NOVA_API) : API backend consommée par ce frontend
- [NOVA_DB](https://github.com/BaditSad/NOVA_DB) : modèle et accès base de données
- [NOVA_LOGS_DB](https://github.com/BaditSad/NOVA_LOGS_DB) : journalisation et suivi applicatif
- [NOVA_ML_ANALYSIS](https://github.com/BaditSad/NOVA_ML_ANALYSIS) : analyse et modèles de machine learning
- [NOVA_ML_PREPROD](https://github.com/BaditSad/NOVA_ML_PREPROD) : préparation et validation des modèles avant mise en production
- [NOVA_ML_MENTAL_HEALTH](https://github.com/BaditSad/NOVA_ML_MENTAL_HEALTH) : modèles liés au suivi psychologique
- [NOVA_ML_SCAN_BODY](https://github.com/BaditSad/NOVA_ML_SCAN_BODY) : modèles de vision pour le check-up dermatologique

## Contact

Brieuc Dumortier - [LinkedIn](https://www.linkedin.com/in/dumortier-brieuc/) - dumortier.contact@gmail.com

GitHub : [@BaditSad](https://github.com/BaditSad)
