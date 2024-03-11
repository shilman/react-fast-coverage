export const A = (props: any) => <div />;
export const B = (props: any) => <div />;

export default (props: any) => {
  if (props.foo) {
    return <div>foo</div>;
  } else {
    return <div>default</div>;
  }
};
