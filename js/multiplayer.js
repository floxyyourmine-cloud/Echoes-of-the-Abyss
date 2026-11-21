/* ==========================================================================
   ECHOES OF THE ABYSS - MULTIPLAYER & LEADERBOARD MODULE
   Leaderboard management, high scores sync, and future co-op scaffold.
   ========================================================================== */

window.Leaderboard = {
  KEY: 'ea_leaderboard',
  getScores: function() {
    try {
      var d = localStorage.getItem(this.KEY);
      return d ? JSON.parse(d) : [];
    } catch(e) {
      return [];
    }
  },
  saveScore: function(name, wave, level, hero) {
    try {
      var list = this.getScores();
      list.push({
        name: name || 'Adventurer',
        wave: wave || 1,
        level: level || 1,
        hero: hero || 'Aether',
        date: new Date().toLocaleDateString()
      });
      list.sort(function(a, b) { return b.wave - a.wave; });
      list = list.slice(0, 20); // Keep top 20
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return list;
    } catch(e) {
      return [];
    }
  }
};

window.MultiplayerSession = {
  connected: false,
  peers: [],
  init: function() {
    // Scaffold ready for WebRTC / WebSocket co-op expansion
    return true;
  },
  sendAction: function(act, data) {
    if (!this.connected) return;
  }
};