import { Component, type ReactNode } from 'react';

/* Si le navigateur ne sait pas dessiner en 3D (WebGL absent ou désactivé),
   le flacon disparaît mais le parcours continue : sans ce garde-fou, la page entière se vide. */
export class BottleBoundary extends Component<{ children: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
