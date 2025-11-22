
import Header from '../../components/header.jsx';

export default function Home() {
  return (
    <div>
      <Header />
      <div>
        <h1>Registrate</h1>
        <form className="RegisterForm">

            <label> 
                <h3> Nombre de usuario: </h3> 
                <input type= "text" name="username" />
            </label>

            <label> 
                <h3> Nombre Completo: </h3> 
                <input type= "text" name="name" />
            </label>


            <label>
                <h3> Correo Electronico: </h3> 
                <input type= "text" name="email" />
            </label>

            <label>
                <h3> Contraseña: </h3> 
                <input type="password" name="password" />
            </label>
            
            <label>
                <h3> Confirmal Contraseña: </h3> 
                <input type="password" name="confirmPassword" />
            </label>

            <button type="submit">Registrarse</button>
        </form>
        </div>  


    </div>
  );
}

function registerUser() {

    const username = document.getElementsByName('username')[0].value;
    const name = document.getElementsByName('name')[0].value;
    const email = document.getElementsByName('email')[0].value;
    const password = document.getElementsByName('password')[0].value;
    const confirmPassword = document.getElementsByName('confirmPassword')[0].value;

    alert(`Usuario ${usarname} registrado con éxito!`);

}