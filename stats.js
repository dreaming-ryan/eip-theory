/**
 * stats.js — quiz.html의 questions 배열을 fetch해서 파싱 후
 * 연도·회차·카테고리 통계를 계산하고 콜백으로 반환합니다.
 * index.html / by_round.html / by_category.html 에서 공유합니다.
 */

(function () {
  'use strict';

  // quiz.html 에서 questions 배열만 추출해 eval-safe하게 파싱
  function loadStats(callback) {
    fetch('quiz.html')
      .then(r => r.text())
      .then(html => {
        // questions = [ ... ]; 부분 추출
        const arrMatch = html.match(/const questions\s*=\s*(\[[\s\S]*?\]);\s*\n\s*let allOpen/);
        if (!arrMatch) { console.error('stats.js: questions 배열 추출 실패'); return; }

        // Function 생성자로 안전하게 평가 (eval 대신)
        const questions = (new Function('return ' + arrMatch[1]))();

        // ── 전체 통계 ──
        const totalQ = questions.length;

        // 연도·회차별 집계
        const roundMap = {}; // { '2025_3회': count, ... }
        const yearSet  = new Set();
        questions.forEach(q => {
          yearSet.add(q.year);
          const key = `${q.year}_${q.round}`;
          roundMap[key] = (roundMap[key] || 0) + 1;
        });

        const totalRounds = Object.keys(roundMap).length;

        // 연도 목록 (오름차순)
        const years = [...yearSet].sort();

        // 연도별 회차 목록
        const yearRounds = {}; // { '2020': ['1회','2회',...], ... }
        years.forEach(y => { yearRounds[y] = []; });
        Object.keys(roundMap).sort().forEach(key => {
          const [y, r] = key.split('_');
          if (yearRounds[y]) yearRounds[y].push(r);
        });
        // 회차 정렬
        Object.keys(yearRounds).forEach(y => {
          yearRounds[y].sort((a, b) => parseInt(a) - parseInt(b));
        });

        // 카테고리별 집계
        const catMap = {};
        questions.forEach(q => {
          catMap[q.cat] = (catMap[q.cat] || 0) + 1;
        });

        callback({ totalQ, totalRounds, years, yearRounds, roundMap, catMap, questions });
      })
      .catch(err => console.error('stats.js fetch 오류:', err));
  }

  // 전역 노출
  window.QuizStats = { load: loadStats };
})();
