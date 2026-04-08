import { render } from "@testing-library/react";

const Page = () => <div>Prova</div>;

it("renders homepage unchanged", () => {
  const { container } = render(<Page />);
  expect(container).toMatchSnapshot();
});
