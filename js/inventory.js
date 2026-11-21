/* ==========================================================================
   ECHOES OF THE ABYSS - INVENTORY & ITEM MANAGEMENT MODULE
   Potions, currency, drops, and shop transaction helpers.
   ========================================================================== */

window.InventorySystem = {
  getPotions: function() {
    return (window.p && typeof window.p.pot !== 'undefined') ? window.p.pot : 3;
  },
  usePotion: function() {
    if (!window.p || window.p.dead > 0) return false;
    if (window.p.pot <= 0) {
      if (typeof window.msg === 'function') window.msg('Potion habis! Kunjungi Alkemis di Desa.');
      return false;
    }
    var maxHp = typeof window.mhp === 'function' ? window.mhp() : 100;
    if (window.p.hp >= maxHp) {
      if (typeof window.msg === 'function') window.msg('HP sudah penuh!');
      return false;
    }
    window.p.pot--;
    window.p.hp = Math.min(maxHp, window.p.hp + Math.round(maxHp * 0.5));
    if (typeof window.SFX !== 'undefined' && window.SFX.pickup) {
      try { window.SFX.pickup(); } catch(e) {}
    }
    if (typeof window.msg === 'function') window.msg('Menggunakan Potion (+50% HP). Sisa: ' + window.p.pot);
    var mobPotBadge = document.getElementById('mobPotCount');
    if (mobPotBadge) {
      mobPotBadge.textContent = window.p.pot;
    }
    return true;
  },
  getGold: function() {
    return (window.WORLD && window.WORLD.S && window.WORLD.S.gold) || 0;
  },
  openShop: function(id) {
    if (window.WORLD && typeof window.WORLD.openShop === 'function') {
      window.WORLD.openShop(id);
    }
  }
};

// Listen for Potion button on Mobile controls if present
document.addEventListener('DOMContentLoaded', function() {
  var potBtn = document.getElementById('mobBtnPotion');
  if (potBtn) {
    potBtn.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      window.InventorySystem.usePotion();
    });
  }
});