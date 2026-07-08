import { eventBus } from './EventBus.js';

let __componentUid = 0;

/**
 * Component — base class for a piece of UI bound to one DOM container.
 *
 * Lifecycle: `beforeMount -> afterMount -> [beforeUpdate -> afterUpdate]* -> beforeUnmount`.
 * Subclasses implement `template(state)` returning an HTML string; `render()`
 * diffs nothing fancy (this app has no build step for a virtual DOM) but does
 * guard against redundant re-renders and always re-delegates events safely
 * because delegation is attached once, on the container, not per-element.
 *
 * @example
 *   class Toast extends Component {
 *     template({ items }) {
 *       return items.map(i => `<div class="toast">${i}</div>`).join('');
 *     }
 *   }
 *   const toast = new Toast(document.getElementById('paToastWrap'));
 *   toast.setState({ items: [] });
 */
export class Component {
  /**
   * @param {HTMLElement} el Mount point. Its innerHTML is fully owned by this component.
   * @param {object} [props]
   */
  constructor(el, props = {}) {
    if (!el) throw new Error('Component requires a mount element');
    this.el = el;
    this.props = props;
    this.state = {};
    this.uid = `c${++__componentUid}`;
    this._mounted = false;
    this._delegatedEvents = new Map(); // eventType -> handler
    this._busUnsubs = [];
  }

  /** Override: return the HTML string for the current state. */
  template(/* state */) {
    return '';
  }

  /** Override: called once before the first render. */
  beforeMount() {}
  /** Override: called once after the first render is in the DOM. */
  afterMount() {}
  /** Override: called before re-rendering due to a state change. */
  beforeUpdate() {}
  /** Override: called after re-rendering due to a state change. */
  afterUpdate() {}
  /** Override: called just before the component tears itself down. */
  beforeUnmount() {}

  /** Merge a partial state patch and re-render. */
  setState(patch) {
    this.state = { ...this.state, ...patch };
    if (!this._mounted) {
      this.mount();
    } else {
      this.beforeUpdate();
      this._paint();
      this.afterUpdate();
    }
  }

  /** First render. Safe to call multiple times; subsequent calls are no-ops. */
  mount() {
    if (this._mounted) return;
    this.beforeMount();
    this._paint();
    this._mounted = true;
    this.afterMount();
  }

  _paint() {
    this.el.innerHTML = this.template(this.state);
  }

  /**
   * Attach a single delegated listener on the container for `type`, filtered
   * by `selector`. Re-renders don't require re-binding since the listener
   * lives on `this.el`, not on the (replaced) children.
   * @param {string} type
   * @param {string} selector
   * @param {(e: Event, target: HTMLElement) => void} handler
   */
  on(type, selector, handler) {
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target && this.el.contains(target)) handler(e, target);
    };
    this.el.addEventListener(type, listener);
    if (!this._delegatedEvents.has(type)) this._delegatedEvents.set(type, []);
    this._delegatedEvents.get(type).push(listener);
  }

  /** Subscribe to the app event bus with automatic cleanup on unmount. */
  onBus(event, handler) {
    this._busUnsubs.push(eventBus.on(event, handler));
  }

  /** Tear down: remove listeners, clear DOM, run hook. */
  unmount() {
    if (!this._mounted) return;
    this.beforeUnmount();
    this._delegatedEvents.forEach((listeners, type) => {
      listeners.forEach((l) => this.el.removeEventListener(type, l));
    });
    this._delegatedEvents.clear();
    this._busUnsubs.forEach((unsub) => unsub());
    this._busUnsubs = [];
    this.el.innerHTML = '';
    this._mounted = false;
  }
}
