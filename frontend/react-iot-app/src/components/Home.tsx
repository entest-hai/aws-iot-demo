import WithSubnavigation from "./NavBar";
import React from "react";
import DynamoDBDataChart from './DynamoDBDataChart';
import IoTSubDataChart from './IoTSubDataChart';


interface HomePageProps {
  user: any,
  signOut: any
}


const HomePage = ({ user, signOut }: HomePageProps) => {

  const childFunc = React.useRef(null);
  const childFuncDb = React.useRef(null);

  const signOutUnSub = () => {
    const unsub = childFunc.current();
    const stopTimer = childFuncDb.current();
    window.localStorage.clear();
    signOut();
  }

  return (
    <div>
      <WithSubnavigation user={user} signOut={signOutUnSub}></WithSubnavigation>
      <DynamoDBDataChart childFunc={childFuncDb}></DynamoDBDataChart>
      <IoTSubDataChart childFunc={childFunc}></IoTSubDataChart>

    </div>
  )
}

export default HomePage; 