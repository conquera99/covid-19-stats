import { Component } from "react";
import Head from "next/head";
import "rsuite/lib/styles/index.less";
import "rsuite/lib/styles/themes/dark/index.less";
import { Container, Header, Navbar, Content, List, FlexboxGrid, Footer, Nav, Icon } from "rsuite";
import MapGL, { GeolocateControl, Source, Layer } from "react-map-gl";
import moment from "moment";

import { APIRequest } from "../services/BaseAPI";

const MAPBOX_TOKEN =
    "pk.eyJ1IjoiY29ucXVlcmE5OSIsImEiOiJjazd3a2Y2Z3AwMzNuM2x0ZHIxbWI2dTVwIn0.nECBBbH1Zz3biOTUM3TCww"; // Set your mapbox token here

const geolocateStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    margin: 10
};

const clusterLayer = {
    id: "clusters",
    type: "circle",
    source: "covid19-cases",
    filter: ["has", "point_count"],
    paint: {
        "circle-color": ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40]
    }
};
const clusterCountLayer = {
    id: "cluster-count",
    type: "symbol",
    source: "covid19-cases",
    filter: ["has", "point_count"],
    layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12
    }
};

const unclusteredPointLayer = {
    id: "unclustered-point",
    type: "circle",
    source: "covid19-cases",
    filter: ["!", ["has", "point_count"]],
    paint: {
        "circle-color": "#11b4da",
        "circle-radius": 4,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff"
    }
};

const navStyle = {
    position: "fixed",
    zIndex: 1,
    width: "100%"
};

const styleCenter = {
    display: "flex",
    alignItems: "center",
    height: "60px",
    padding: "0 10px"
};

const slimText = {
    fontSize: "0.8em",
    color: "#97969B",
    fontWeight: "lighter",
    paddingBottom: 5
};

const titleStyle = {
    paddingBottom: 5,
    whiteSpace: "nowrap",
    fontWeight: 500
};

const dataStyle = {
    fontSize: "1.2em",
    fontWeight: 500
};

const dataStyleRed = {
    fontSize: "1.2em",
    fontWeight: 500,
    color: "#ff3b3b"
};

const dataStyleGreen = {
    fontSize: "1.2em",
    fontWeight: 500,
    color: "#9eea00"
};

const countryStyle = {
    position: "absolute",
    width: "30%",
    top: 56,
    height: "calc(100vh - 56px)",
    overflow: "auto"
};

const footerStyle = {
    position: "absolute",
    width: "70%",
    bottom: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#0f131a",
    boxShadow: "0 -1px 0 #292d33, 0 1px 0 #292d33"
};

class Home extends Component {
    constructor(props) {
        super(props);

        this._sourceRef = React.createRef();

        this.viewportChange = this.viewportChange.bind(this);
        this.loadAllCountries = this.loadAllCountries.bind(this);
        this.renderCountries = this.renderCountries.bind(this);
        this.loadSummary = this.loadSummary.bind(this);
        this.redraw = this.redraw.bind(this);

        this.state = {
            summary: {
                cases: 0,
                deaths: 0,
                recovered: 0,
                updated: 0
            },
            cities: ["china"],
            countries: [],
            viewport: {
                latitude: 19.488205240905323,
                longitude: 76.49824179077201,
                zoom: 1.5,
                bearing: 0,
                pitch: 0
            }
        };
    }

    componentDidMount() {
        this.loadAllCountries();
        this.loadSummary();
    }

    viewportChange(viewport) {
        this.setState({ viewport });
    }

    loadAllCountries() {
        APIRequest("countries")
            .then(response => {
                this.setState({
                    countries: response
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    loadSummary() {
        APIRequest("all")
            .then(response => {
                this.setState({
                    summary: response
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    redraw({ project }) {
        const [cx, cy] = project([-122, 37]);
        return <circle cx={cx} cy={cy} r={4} fill="blue" />;
    }

    renderCountries() {
        const { countries } = this.state;

        return countries.map(item => {
            let newCases = <div>{item["todayCases"].toLocaleString()}</div>;

            if (item["todayCases"] > 0) {
                newCases = (
                    <div style={{ color: "#ffb162" }}>+{item["todayCases"].toLocaleString()}</div>
                );
            }

            return (
                <List.Item key={item["country"]}>
                    <FlexboxGrid>
                        <FlexboxGrid.Item
                            colspan={6}
                            style={{
                                ...styleCenter,
                                flexDirection: "column",
                                alignItems: "flex-start",
                                overflow: "hidden"
                            }}
                        >
                            <div style={titleStyle}>{item["country"]}</div>
                            <div style={slimText}>
                                <div>Today Cases</div>
                                {newCases}
                            </div>
                        </FlexboxGrid.Item>
                        <FlexboxGrid.Item colspan={6} style={styleCenter}>
                            <div style={{ textAlign: "right" }}>
                                <div style={slimText}>Total Cases</div>
                                <div style={dataStyle}>{item["cases"].toLocaleString()}</div>
                            </div>
                        </FlexboxGrid.Item>
                        <FlexboxGrid.Item colspan={6} style={styleCenter}>
                            <div style={{ textAlign: "right" }}>
                                <div style={slimText}>Total Deaths</div>
                                <div style={dataStyleRed}>{item["deaths"].toLocaleString()}</div>
                            </div>
                        </FlexboxGrid.Item>
                        <FlexboxGrid.Item colspan={6} style={styleCenter}>
                            <div style={{ textAlign: "right" }}>
                                <div style={slimText}>Recovered</div>
                                <div style={dataStyleGreen}>
                                    {item["recovered"].toLocaleString()}
                                </div>
                            </div>
                        </FlexboxGrid.Item>
                    </FlexboxGrid>
                </List.Item>
            );
        });
    }

    _onClick = event => {
        const feature = event.features[0];
        const clusterId = feature.properties.cluster_id;

        const mapboxSource = this._sourceRef.current.getSource();

        mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) {
                return;
            }

            this.viewportChange({
                ...this.state.viewport,
                longitude: feature.geometry.coordinates[0],
                latitude: feature.geometry.coordinates[1],
                zoom,
                transitionDuration: 500
            });
        });
    };

    render() {
        const { viewport, summary, cities } = this.state;

        return (
            <Container>
                <Head>
                    <title>Covid-19</title>
                    <link rel="icon" href="/favicon.ico" />
                    <link
                        rel="stylesheet"
                        href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.css"
                    />
                    <link rel="stylesheet" href="/style.css" />
                </Head>

                <Header>
                    <Navbar appearance="inverse" style={navStyle}>
                        <Navbar.Header>
                            <a className="navbar-brand logo">Covid-19</a>
                        </Navbar.Header>
                        <Navbar.Body>
                            <Nav pullRight>
                                <Nav.Item
                                    target="_blank"
                                    href="https://github.com/conquera99/covid-19-stats"
                                    icon={<Icon icon="github" />}
                                ></Nav.Item>
                                <Nav.Item
                                    target="_blank"
                                    href="https://instagram.com/conquera99"
                                    icon={<Icon icon="instagram" />}
                                ></Nav.Item>
                            </Nav>
                        </Navbar.Body>
                    </Navbar>
                </Header>
                <Container>
                    <Content>
                        <MapGL
                            {...viewport}
                            width="100wh"
                            height="100vh"
                            mapStyle="mapbox://styles/mapbox/dark-v9"
                            onViewportChange={this.viewportChange}
                            mapboxApiAccessToken={MAPBOX_TOKEN}
                            interactiveLayerIds={[clusterLayer.id]}
                        >
                            <GeolocateControl
                                style={geolocateStyle}
                                positionOptions={{ enableHighAccuracy: true }}
                                trackUserLocation={true}
                            />
                            <Source
                                type="geojson"
                                data="https://covid19.nunukan.net/indonesia.geojson"
                                cluster={true}
                                clusterMaxZoom={14}
                                clusterRadius={50}
                                ref={this._sourceRef}
                            >
                                <Layer {...clusterLayer} />
                                <Layer {...clusterCountLayer} />
                                <Layer {...unclusteredPointLayer} />
                            </Source>
                        </MapGL>
                    </Content>
                    <Footer style={footerStyle}>
                        <FlexboxGrid>
                            <FlexboxGrid.Item
                                colspan={6}
                                style={{
                                    ...styleCenter,
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    overflow: "hidden"
                                }}
                            >
                                <div style={titleStyle}>Summary</div>
                                <div style={slimText}>
                                    <div>Updated At</div>
                                    <div>
                                        {moment(summary["updated"]).format("DD MMM YYYY HH:mm:ss")}
                                    </div>
                                </div>
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={6} style={styleCenter}>
                                <div style={{ textAlign: "right" }}>
                                    <div style={slimText}>Total Cases</div>
                                    <div style={dataStyle}>{summary["cases"].toLocaleString()}</div>
                                </div>
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={6} style={styleCenter}>
                                <div style={{ textAlign: "right" }}>
                                    <div style={slimText}>Total Deaths</div>
                                    <div style={dataStyleRed}>
                                        {summary["deaths"].toLocaleString()}
                                    </div>
                                </div>
                            </FlexboxGrid.Item>
                            <FlexboxGrid.Item colspan={6} style={styleCenter}>
                                <div style={{ textAlign: "right" }}>
                                    <div style={slimText}>Recovered</div>
                                    <div style={dataStyleGreen}>
                                        {summary["recovered"].toLocaleString()}
                                    </div>
                                </div>
                            </FlexboxGrid.Item>
                        </FlexboxGrid>
                    </Footer>

                    <FlexboxGrid align="top" style={countryStyle}>
                        <FlexboxGrid.Item colspan={24}>
                            <List hover>{this.renderCountries()}</List>
                        </FlexboxGrid.Item>
                    </FlexboxGrid>
                </Container>
            </Container>
        );
    }
}

export default Home;
