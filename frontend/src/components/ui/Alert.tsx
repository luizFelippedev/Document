export const Alert = ({ message, type = "info" }) => { return <div className={`alert alert-${type}`}>{message}</div> }
