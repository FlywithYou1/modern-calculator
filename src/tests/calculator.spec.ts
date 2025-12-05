import { render, fireEvent, screen } from '@testing-library/vue';
import { createPinia } from 'pinia';
import Calculator from '@/components/Calculator.vue';
import i18n from '@/locales';

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    minimize: vi.fn(),
    maximize: vi.fn(),
    isMaximized: vi.fn(),
    unmaximize: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockRejectedValue(new Error('offline')),
}));

const renderWithPlugins = () =>
  render(Calculator, {
    global: {
      plugins: [createPinia(), i18n],
    },
  });

describe('Calculator', () => {
  it('renders default display', () => {
    renderWithPlugins();
    expect(screen.getByLabelText(/当前显示/)).toHaveTextContent('0');
  });

  it('computes a simple expression with fallback eval', async () => {
    renderWithPlugins();
    for (const key of ['2', '+', '3', '=']) {
      await fireEvent.click(screen.getByText(key));
    }
    expect(screen.getByLabelText(/当前显示/)).toHaveTextContent('5');
  });

  it('handles clear and delete', async () => {
    renderWithPlugins();
    for (const key of ['9', '9', 'DEL']) {
      await fireEvent.click(screen.getByText(key));
    }
    expect(screen.getByLabelText(/当前显示/)).toHaveTextContent('9');
    await fireEvent.click(screen.getByText('C'));
    expect(screen.getByLabelText(/当前显示/)).toHaveTextContent('0');
  });

  it('switches to scientific mode and uses trig', async () => {
    renderWithPlugins();
    await fireEvent.click(screen.getByText('Mode'));
    await fireEvent.click(screen.getByText('sin'));
    await fireEvent.click(screen.getByText('π'));
    await fireEvent.click(screen.getByText('/'));
    await fireEvent.click(screen.getByText('2'));
    await fireEvent.click(screen.getByText(')'));
    await fireEvent.click(screen.getByText('='));
    expect(screen.getByLabelText(/当前显示/)).not.toHaveTextContent('Error');
  });
});
