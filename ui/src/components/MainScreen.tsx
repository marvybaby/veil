import React from 'react'
import { Menu, Image } from 'semantic-ui-react'
import MainView from './MainView';
import { userContext } from './App';

type Props = {
  onLogout: () => void;
}

const MainScreen: React.FC<Props> = ({ onLogout }) => {
  const party = userContext.useParty();

  return (
    <>
      <Menu icon borderless>
        <Menu.Item>
          <Image
            as='a'
            href='https://canton.network'
            target='_blank'
            src='/daml.svg'
            alt='Veil'
            size='mini'
          />
        </Menu.Item>
        <Menu.Item header>
          Veil — Confidential Invoice Financing
        </Menu.Item>
        <Menu.Menu position='right'>
          <Menu.Item position='right'>
            Logged in as <strong>&nbsp;{party}</strong>
          </Menu.Item>
          <Menu.Item
            position='right'
            active={false}
            onClick={onLogout}
            icon='log out'
          />
        </Menu.Menu>
      </Menu>
      <MainView />
    </>
  );
};

export default MainScreen;