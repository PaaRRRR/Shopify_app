import React, { useState } from 'react';
import { ResourceList, ResourceItem, Thumbnail, TextStyle, Card, Form, FormLayout, TextField, Button } from '@shopify/polaris';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { FormLayout } from '@shopify/polaris/dist/types/latest/src';

const GET_PRODUCT_VARIANTS = gql`
    query ProductVariants {
        productVariants(first: 10) {
            edges {
                node {
                    id
                    title
                    image {
                        id
                        originalSrc
                    }
                }
            }
        }
    }
`

const CreateOrdersList = () => {
    const [selectedItems, setSelectedItems] = useState([]);

    const submitHandler = (event) => {
        fetch(`/createDraftOrder?${selectedItems.map(
            (item) => { return `items=${item}`}
        ).join('&')}`).then(resp => { console.log(resp) });
    }

    const resourceName = {
        singular: 'customer',
        plural: 'customers'
    };

    let items = [];

    return (
        <>
            <Query query={GET_PRODUCT_VARIANTS}>
                {({ data, loading, error }) => {
                    if (loading) return <Card><p>Loading...</p></Card>
                    if (error) return <Card><p>{error.message}</p></Card>

                    items = data.productVariants.edges;
                    return <ResourceList 
                                resourceName={resourceName}
                                items={items}
                                renderItem={renderItem}
                                selectedItems={selectedItems}
                                onSelectionChange={setSelectedItems}
                                selectable
                            />
                }}
            </Query>
            <Form onSubmit={(event) => { console.log() }}>
                <FormLayout>
                    <TextField value={selectedItems} type="hidden" />

                    <Button submit>Create Order</Button>
                </FormLayout>
            </Form>
        </>
    )
}

const renderItem = (product) => {
    const { node } = product;
    const media = <Thumbnail source={ node.image ? node.image.originalSrc : '' }  />

    return (
        <ResourceItem
            id={node.id}
            media={media}
            accessibilityLabel={`view details for ${node.title}`}
        >
            <h3>
                <TextStyle variation="strong">{node.title}</TextStyle>
            </h3>
        </ResourceItem>
    )

}

export default CreateOrdersList;