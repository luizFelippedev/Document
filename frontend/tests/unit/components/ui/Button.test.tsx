import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../../../src/components/ui/Button";
describe("Button component", () => {
  test("renders button with children", () => {
    render(<Button>Click me</Button>);
    const buttonElement = screen.getByText(/click me/i);
    expect(buttonElement).toBeInTheDocument();
  });
  test("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const buttonElement = screen.getByText(/click me/i);
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  test("applies the correct CSS class based on variant", () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    let buttonElement = screen.getByText(/primary/i);
    expect(buttonElement).toHaveClass("btn-primary");
    rerender(<Button variant="secondary">Secondary</Button>);
    buttonElement = screen.getByText(/secondary/i);
    expect(buttonElement).toHaveClass("btn-secondary");
    rerender(<Button variant="outline">Outline</Button>);
    buttonElement = screen.getByText(/outline/i);
    expect(buttonElement).toHaveClass("btn-outline");
  });
});
