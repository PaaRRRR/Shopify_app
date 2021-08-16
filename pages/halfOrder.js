import React from 'react';
import { Layout, Page, Card } from '@shopify/polaris';
import CreateOrder from '../components/graphql/CreateOrders';
import CreateOrdersList from '../components/graphql/CreateOrdersList';

class Orders extends React.Component {
    render() {
        return(
            <Page>
                <Layout>
                    <Layout.Section onHalf>
                        <Card title="Manual Order Creation">
                            <Card.Section>
                                <CreateOrder></CreateOrder>
                            </Card.Section>
                        </Card>
                    </Layout.Section>

                    <Layout.Section onHalf>
                        <Card title="Create Order with Resource List">
                            <Card.Section>
                                <CreateOrdersList></CreateOrdersList>
                            </Card.Section>
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>
        )
    }
}

export default Orders;