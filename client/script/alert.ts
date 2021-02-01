type AlertStyle = 'alert-primary' | 'alert-secondary' | 'alert-success' | 'alert-danger' | 'alert-warning' | 'alert-info' | 'alert-light' | 'alert-dark';

export class Alert {

  private style: AlertStyle;

  private createUi(m: string) {
    const wrapper = document.createElement('div');
    wrapper.className = `alert ${this.style} alert-dismissible fade show`
    wrapper.style.zIndex = '1073';
    wrapper.style.position = 'fixed';
    wrapper.style.bottom = '1em';
    wrapper.style.left = '50%';
    wrapper.style.transform = 'translateX(-50%)';

    const textElem = document.createElement('span');
    textElem.appendChild(document.createTextNode(m));

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-close';

    wrapper.appendChild(textElem);
    wrapper.appendChild(btn);

    return wrapper;
  }

  setSuccess(): Alert {
    this.style = 'alert-success';
    return this;
  }

  setDanger(): Alert {
    this.style = 'alert-danger';
    return this;
  }

  show(m: string) {
    const alert = this.createUi(m);
    document.body.appendChild(alert);
  }

  static success(m: string) {
    (new Alert()).setSuccess().show(m);
  }

  static danger(m: string) {
    (new Alert()).setDanger().show(m);
  }
}

