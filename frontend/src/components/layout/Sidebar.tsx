export const Sidebar = ({ isAdmin = false }) => { return <aside className="sidebar"><ul>{isAdmin ? <li>Admin Menu</li> : <li>User Menu</li>}</ul></aside> }
